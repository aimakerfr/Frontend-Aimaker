import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, getPublicProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { useLanguage } from '../../language/useLanguage';
import './SuiviDemandesView.css';

type DemandeType = 'Bug' | 'Question' | 'Evolution' | 'Deploiement' | 'Autre';
type DemandeStatus = 'Nouveau' | 'En cours' | 'En attente' | 'Resolu (propose)' | 'Clos' | 'Rejete (propose)' | 'Rejete (confirme)';

type Demande = {
  id: string;
  titre: string;
  type: DemandeType;
  priorite: number;
  statut: DemandeStatus;
  declarePar: string;
  dateCreation: string;
  assigneA: string;
  description: string;
  reponse: string;
  dateResolution: string | null;
  derniereMaj: string;
};

type CommentItem = {
  auteur: string;
  date: string;
  texte: string;
};

type PersonScope = 'team' | 'client';

type Person = {
  id: string;
  name: string;
  role: string;
  scope: PersonScope;
};

type AppView = 'dashboard' | 'list';
type FilterView = 'all' | 'mine' | 'waiting';

type PersistedState = {
  version: number;
  demandes: Demande[];
  comments: Record<string, CommentItem[]>;
  currentUser: string;
  people: Person[];
  nextDemandeNumber: number;
};

const PERSIST_STEP_ID = 1;
const ALL_FILTER_VALUE = '__all__';

const TYPES: DemandeType[] = ['Bug', 'Question', 'Evolution', 'Deploiement', 'Autre'];
const PRIORITIES = [
  { val: 1, color: '#94a3b8' },
  { val: 2, color: '#3b82f6' },
  { val: 3, color: '#f59e0b' },
  { val: 4, color: '#ef4444' },
] as const;
const STATUTS: DemandeStatus[] = [
  'Nouveau',
  'En cours',
  'En attente',
  'Resolu (propose)',
  'Clos',
  'Rejete (propose)',
  'Rejete (confirme)',
];
const LEGACY_TEAM_NAMES = new Set(['David Esteban', 'Manu', 'Guy Kastenbaum', 'Philippe Parmentier']);
const DEFAULT_ROLE_BY_SCOPE: Record<PersonScope, string> = {
  team: 'Team',
  client: 'Client',
};
const TYPE_ICON: Record<DemandeType, string> = {
  Bug: '🐛',
  Question: '❓',
  Evolution: '🚀',
  Deploiement: '📦',
  Autre: '📋',
};
const STATUT_COLORS: Record<DemandeStatus, string> = {
  Nouveau: '#3b82f6',
  'En cours': '#10b981',
  'En attente': '#f59e0b',
  'Resolu (propose)': '#8b5cf6',
  Clos: '#5a6a8a',
  'Rejete (propose)': '#ef4444',
  'Rejete (confirme)': '#991b1b',
};

const isRecord = (value: unknown): value is Record<string, any> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const scopeFromRoleOrName = (name: string, role: string): PersonScope => {
  const roleValue = role.toLowerCase();
  const teamHint = ['team', 'dev', 'ops', 'support', 'manager', 'admin', 'tech'].some((hint) => roleValue.includes(hint));
  if (teamHint || LEGACY_TEAM_NAMES.has(name)) return 'team';
  return 'client';
};

const toPersonId = (name: string, index: number): string => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `PER-${slug || 'user'}-${index + 1}`;
};

const ensurePeopleFromNames = (names: string[]): Person[] => {
  const uniqueNames: string[] = [];
  const seen = new Set<string>();

  names.forEach((rawName) => {
    const name = rawName.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    uniqueNames.push(name);
  });

  return uniqueNames.map((name, index) => {
    const scope = scopeFromRoleOrName(name, '');
    return {
      id: toPersonId(name, index),
      name,
      scope,
      role: DEFAULT_ROLE_BY_SCOPE[scope],
    };
  });
};

const extractDemandeNumber = (id: string): number => {
  const match = /^DEM-(\d+)$/.exec(id.trim());
  if (!match) return 0;
  return Number(match[1]) || 0;
};

const getNextDemandeNumber = (items: Demande[]): number => {
  const maxNumber = items.reduce((max, item) => Math.max(max, extractDemandeNumber(item.id)), 0);
  return maxNumber + 1;
};

const isValidDemande = (value: unknown): value is Demande => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.titre === 'string'
    && TYPES.includes(value.type as DemandeType)
    && typeof value.priorite === 'number'
    && STATUTS.includes(value.statut as DemandeStatus)
    && typeof value.declarePar === 'string'
    && typeof value.dateCreation === 'string'
    && typeof value.assigneA === 'string'
    && typeof value.description === 'string'
    && typeof value.reponse === 'string'
    && (typeof value.dateResolution === 'string' || value.dateResolution === null)
    && typeof value.derniereMaj === 'string'
  );
};

const isValidPerson = (value: unknown): value is Person => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.role === 'string'
    && (value.scope === 'team' || value.scope === 'client')
  );
};

const sanitizePersistedState = (value: unknown): PersistedState | null => {
  if (!isRecord(value)) return null;

  const rawDemandes = Array.isArray(value.demandes) ? value.demandes.filter(isValidDemande) : [];

  const rawComments = isRecord(value.comments) ? value.comments : {};
  const comments: Record<string, CommentItem[]> = {};
  Object.entries(rawComments).forEach(([key, rows]) => {
    if (!Array.isArray(rows)) return;
    comments[key] = rows
      .filter((row) => isRecord(row) && typeof row.auteur === 'string' && typeof row.date === 'string' && typeof row.texte === 'string')
      .map((row) => ({ auteur: row.auteur, date: row.date, texte: row.texte }));
  });

  const legacyNames = new Set<string>();
  rawDemandes.forEach((demande) => {
    legacyNames.add(demande.declarePar);
    if (demande.assigneA) legacyNames.add(demande.assigneA);
  });
  Object.values(comments).forEach((rows) => {
    rows.forEach((row) => legacyNames.add(row.auteur));
  });

  if (typeof value.currentUser === 'string' && value.currentUser.trim()) {
    legacyNames.add(value.currentUser.trim());
  }

  let people = Array.isArray(value.people) ? value.people.filter(isValidPerson) : [];
  if (!people.length && legacyNames.size > 0) {
    people = ensurePeopleFromNames(Array.from(legacyNames));
  }

  const currentUser = typeof value.currentUser === 'string'
    ? value.currentUser
    : (people[0]?.name || '');

  const rawNextDemandeNumber = Number(value.nextDemandeNumber);
  const nextDemandeNumber = Number.isFinite(rawNextDemandeNumber) && rawNextDemandeNumber > 0
    ? Math.floor(rawNextDemandeNumber)
    : getNextDemandeNumber(rawDemandes);

  return {
    version: typeof value.version === 'number' ? value.version : 1,
    demandes: rawDemandes,
    comments,
    currentUser,
    people,
    nextDemandeNumber,
  };
};

const daysSince = (dateValue: string): number => {
  return Math.floor((Date.now() - new Date(dateValue).getTime()) / 864e5);
};

const fmtDate = (value: string, locale: string): string => {
  return new Date(value).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (value: string, locale: string): string => {
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isTeam = (user: string, people: Person[]): boolean => {
  const person = people.find((entry) => entry.name === user);
  if (person) return person.scope === 'team';
  return LEGACY_TEAM_NAMES.has(user);
};

const prioColor = (priority: number): string => {
  return PRIORITIES.find((item) => item.val === priority)?.color || '#94a3b8';
};

const Badge: React.FC<{ label: string; color: string; small?: boolean }> = ({ label, color, small = false }) => {
  return (
    <span
      className="badge"
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        fontSize: small ? '10px' : undefined,
        padding: small ? '2px 7px' : undefined,
      }}
    >
      {label}
    </span>
  );
};

const PriorityDot: React.FC<{ priority: number }> = ({ priority }) => {
  const color = prioColor(priority);
  return <span className="priority-dot" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} title={`P${priority}`} />;
};

const SuiviDemandesView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage() as any;

  const tr = (t as any).suiviDemandes || {};
  const activeLocale = typeof language === 'string' && language ? language : 'fr';

  const defaultPriorityLabels: Record<number, string> = {
    1: 'Basse',
    2: 'Normale',
    3: 'Haute',
    4: 'Critique',
  };

  const getTypeLabel = (type: DemandeType): string => tr.types?.[type] || type;
  const getStatusLabel = (status: DemandeStatus): string => tr.statuses?.[status] || status;
  const getPriorityLabel = (priority: number): string => tr.priorities?.[String(priority)] || defaultPriorityLabels[priority] || String(priority);
  const getActionLabel = (action: string): string => {
    if (action === 'Reouvrir') return tr.actions?.reopen || 'Reouvrir';
    if (STATUTS.includes(action as DemandeStatus)) return getStatusLabel(action as DemandeStatus);
    return action;
  };
  const dayShort = tr.common?.dayShort || 'j';
  const requestWord = (count: number): string => (count > 1 ? (tr.words?.requestPlural || 'demandes') : (tr.words?.requestSingular || 'demande'));
  const criticalWord = (count: number): string => (count > 1 ? (tr.words?.criticalPlural || 'critiques') : (tr.words?.criticalSingular || 'critique'));

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [comments, setComments] = useState<Record<string, CommentItem[]>>({});
  const [people, setPeople] = useState<Person[]>([]);
  const [currentUser, setCurrentUser] = useState('');
  const [nextDemandeNumber, setNextDemandeNumber] = useState(1);

  const [view, setView] = useState<AppView>('dashboard');
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [filterStatut, setFilterStatut] = useState<string>(ALL_FILTER_VALUE);
  const [filterType, setFilterType] = useState<string>(ALL_FILTER_VALUE);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showPeoplePanel, setShowPeoplePanel] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [personForm, setPersonForm] = useState<{ name: string; role: string; scope: PersonScope }>({
    name: '',
    role: '',
    scope: 'client',
  });

  const teamPeople = useMemo(() => people.filter((person) => person.scope === 'team'), [people]);
  const assignablePeopleNames = useMemo(() => {
    const source = teamPeople.length > 0 ? teamPeople : people;
    return source.map((person) => person.name);
  }, [teamPeople, people]);
  const allPeopleNames = useMemo(() => people.map((person) => person.name), [people]);
  const getPreferredAssignee = (): string => {
    if (currentUser && assignablePeopleNames.includes(currentUser)) return currentUser;
    return assignablePeopleNames[0] || '';
  };

  const [formState, setFormState] = useState({
    titre: '',
    type: 'Bug' as DemandeType,
    priorite: 2,
    assigneA: '',
    description: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) {
          setLoadError(tr.errors?.invalidProductId || 'ID de producto invalido.');
          setIsLoading(false);
          setIsHydrated(true);
          return;
        }

        const productId = Number(id);
        if (!Number.isFinite(productId) || productId <= 0) {
          setLoadError(tr.errors?.invalidProductId || 'ID de producto invalido.');
          setIsLoading(false);
          setIsHydrated(true);
          return;
        }

        let loadedProduct: Product;
        try {
          loadedProduct = await getProduct(productId);
        } catch {
          loadedProduct = await getPublicProduct(productId);
        }

        setProduct(loadedProduct);

        const rows = await getProductStepProgress(loadedProduct.id);
        const row = rows.find((item) => item.stepId === PERSIST_STEP_ID);
        const persisted = sanitizePersistedState(row?.resultText);

        if (persisted) {
          setDemandes(persisted.demandes);
          setComments(persisted.comments);
          setPeople(persisted.people);
          setCurrentUser(persisted.currentUser || persisted.people[0]?.name || '');
          setNextDemandeNumber(persisted.nextDemandeNumber);
        }
      } catch (error) {
        console.error('[SuiviDemandesView] Error loading data:', error);
        setLoadError(tr.errors?.loadFailed || 'No se pudo cargar el seguimiento de demandas.');
      } finally {
        setIsLoading(false);
        setIsHydrated(true);
      }
    };

    void load();
  }, [id]);

  useEffect(() => {
    if (!isHydrated || !product?.id) return;

    const timeout = window.setTimeout(() => {
      void updateProductStepProgress({
        productId: product.id,
        stepId: PERSIST_STEP_ID,
        status: 'success',
        resultText: {
          version: 2,
          demandes,
          comments,
          currentUser,
          people,
          nextDemandeNumber,
        },
      }).catch((error) => {
        console.error('[SuiviDemandesView] Error saving progress:', error);
      });
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [isHydrated, product?.id, demandes, comments, currentUser, people, nextDemandeNumber]);

  useEffect(() => {
    if (people.length === 0) {
      if (currentUser) setCurrentUser('');
      if (formState.assigneA) {
        setFormState((prev) => ({ ...prev, assigneA: '' }));
      }
      return;
    }

    if (!currentUser || !allPeopleNames.includes(currentUser)) {
      setCurrentUser(allPeopleNames[0]);
    }

    if (!formState.assigneA || !allPeopleNames.includes(formState.assigneA)) {
      const fallbackAssignee = getPreferredAssignee();
      if (formState.assigneA !== fallbackAssignee) {
        setFormState((prev) => ({ ...prev, assigneA: fallbackAssignee }));
      }
    }
  }, [people, allPeopleNames, assignablePeopleNames, currentUser, formState.assigneA]);

  const openDem = useMemo(() => {
    return demandes.filter((item) => !['Clos', 'Rejete (confirme)'].includes(item.statut));
  }, [demandes]);

  const lateDem = useMemo(() => {
    return openDem.filter((item) => daysSince(item.derniereMaj) >= 7);
  }, [openDem]);

  const resolvedWeek = useMemo(() => {
    const weekStart = Date.now() - 7 * 864e5;
    return demandes.filter((item) => item.dateResolution && new Date(item.dateResolution).getTime() > weekStart);
  }, [demandes]);

  const avgResolution = useMemo(() => {
    const resolved = demandes.filter((item) => item.dateResolution);
    if (!resolved.length) return '—';

    const totalDays = resolved.reduce((sum, item) => {
      return sum + (new Date(item.dateResolution as string).getTime() - new Date(item.dateCreation).getTime()) / 864e5;
    }, 0);

    return `${(totalDays / resolved.length).toFixed(1)}${dayShort}`;
  }, [demandes, dayShort]);

  const filteredDemandes = useMemo(() => {
    let list = [...demandes];

    if (filterView === 'mine') {
      list = list.filter((item) => item.declarePar === currentUser || item.assigneA === currentUser);
    }

    if (filterView === 'waiting') {
      list = list.filter((item) => item.statut === 'En attente');
    }

    if (filterStatut !== ALL_FILTER_VALUE) {
      list = list.filter((item) => item.statut === filterStatut);
    }

    if (filterType !== ALL_FILTER_VALUE) {
      list = list.filter((item) => item.type === filterType);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => item.titre.toLowerCase().includes(query) || item.id.toLowerCase().includes(query));
    }

    return list.sort((a, b) => new Date(b.derniereMaj).getTime() - new Date(a.derniereMaj).getTime());
  }, [demandes, filterView, filterStatut, filterType, search, currentUser]);

  const selectedDemande = useMemo(() => {
    return selectedId ? demandes.find((item) => item.id === selectedId) || null : null;
  }, [demandes, selectedId]);

  const waitingCount = useMemo(() => {
    return demandes.filter((item) => item.statut === 'En attente').length;
  }, [demandes]);

  const activeUserStats = useMemo(() => {
    if (!currentUser) return { declared: 0, assigned: 0 };
    const declared = demandes.filter((item) => item.declarePar === currentUser).length;
    const assigned = demandes.filter((item) => item.assigneA === currentUser).length;
    return { declared, assigned };
  }, [demandes, currentUser]);

  const topDeclarants = useMemo(() => {
    const map: Record<string, number> = {};
    demandes.forEach((item) => {
      map[item.declarePar] = (map[item.declarePar] || 0) + 1;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [demandes]);

  const possibleActions = (demande: Demande): string[] => {
    const actions: string[] = [];
    const user = currentUser;
    const isClosed = ['Clos', 'Rejete (confirme)'].includes(demande.statut);
    if (isClosed) return actions;

    const teamUser = isTeam(user, people);
    const isDeclarant = demande.declarePar === user;

    if (teamUser) {
      if (['Nouveau', 'En attente'].includes(demande.statut)) actions.push('En cours');
      if (['Nouveau', 'En cours'].includes(demande.statut)) actions.push('En attente');
      if (['En cours', 'En attente'].includes(demande.statut)) actions.push('Resolu (propose)');
      if (demande.statut === 'Nouveau' && (user === 'David Esteban' || user === 'Philippe Parmentier')) actions.push('Rejete (propose)');
    }

    if (isDeclarant) {
      if (demande.statut === 'Resolu (propose)') actions.push('Clos');
      if (demande.statut === 'Rejete (propose)') actions.push('Rejete (confirme)');
      if (['Resolu (propose)', 'Rejete (propose)'].includes(demande.statut)) actions.push('Reouvrir');
    }

    return actions;
  };

  const resetFilters = () => {
    setFilterStatut(ALL_FILTER_VALUE);
    setFilterType(ALL_FILTER_VALUE);
    setSearch('');
  };

  const focusCurrentUserTasks = () => {
    setView('list');
    setFilterView('mine');
    setSelectedId(null);
    resetFilters();
  };

  const openCreateForm = () => {
    setFormState((prev) => ({
      ...prev,
      assigneA: getPreferredAssignee(),
    }));
    setShowForm(true);
  };

  const handleCurrentUserChange = (nextUser: string) => {
    setCurrentUser(nextUser);
    if (assignablePeopleNames.includes(nextUser)) {
      setFormState((prev) => ({ ...prev, assigneA: nextUser }));
    }
  };

  const createDemande = () => {
    if (!currentUser) {
      window.alert(tr.people?.selectCurrentUser || 'Selecciona o crea una persona para continuar.');
      return;
    }

    const titre = formState.titre.trim();
    const description = formState.description.trim();

    if (!titre || !description) {
      window.alert(tr.modal?.requiredFields || 'Titre et description obligatoires.');
      return;
    }

    const now = new Date().toISOString();
    const next: Demande = {
      id: `DEM-${String(nextDemandeNumber).padStart(3, '0')}`,
      titre,
      type: formState.type,
      priorite: Number(formState.priorite),
      statut: 'Nouveau',
      declarePar: currentUser,
      dateCreation: now,
      assigneA: formState.assigneA,
      description,
      reponse: '',
      dateResolution: null,
      derniereMaj: now,
    };

    setDemandes((prev) => [...prev, next]);
    setNextDemandeNumber((prev) => prev + 1);
    setShowForm(false);
    setFormState({
      titre: '',
      type: 'Bug',
      priorite: 2,
      assigneA: getPreferredAssignee(),
      description: '',
    });
  };

  const addPerson = () => {
    const name = personForm.name.trim();
    const role = personForm.role.trim() || DEFAULT_ROLE_BY_SCOPE[personForm.scope];

    if (!name) {
      window.alert(tr.people?.nameRequired || 'El nombre es obligatorio.');
      return;
    }

    const exists = people.some((person) => person.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      window.alert(tr.people?.duplicateName || 'Ya existe una persona con ese nombre.');
      return;
    }

    const created: Person = {
      id: `PER-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      role,
      scope: personForm.scope,
    };

    setPeople((prev) => [...prev, created]);
    if (!currentUser) {
      setCurrentUser(name);
    }

    setPersonForm({
      name: '',
      role: '',
      scope: personForm.scope,
    });
  };

  const deletePerson = (personId: string) => {
    const target = people.find((person) => person.id === personId);
    if (!target) return;

    const confirmDelete = window.confirm(tr.people?.confirmDeletePerson || 'Eliminar esta persona?');
    if (!confirmDelete) return;

    const remaining = people.filter((person) => person.id !== personId);
    setPeople(remaining);

    setDemandes((prev) => prev.map((item) => {
      if (item.assigneA !== target.name) return item;
      return {
        ...item,
        assigneA: '',
        derniereMaj: new Date().toISOString(),
      };
    }));

    if (currentUser === target.name) {
      setCurrentUser(remaining[0]?.name || '');
    }
  };

  const deleteDemande = (demId: string) => {
    const confirmDelete = window.confirm(tr.actions?.confirmDeleteTask || 'Eliminar esta tarea?');
    if (!confirmDelete) return;

    setDemandes((prev) => prev.filter((item) => item.id !== demId));
    setComments((prev) => {
      const next = { ...prev };
      delete next[demId];
      return next;
    });

    if (selectedId === demId) {
      setSelectedId(null);
      setStatusAction(null);
      setStatusReason('');
      setCommentDraft('');
    }
  };

  const reassignDemande = (demId: string, assignee: string) => {
    const now = new Date().toISOString();
    setDemandes((prev) => prev.map((item) => {
      if (item.id !== demId) return item;
      return {
        ...item,
        assigneA: assignee,
        derniereMaj: now,
      };
    }));
  };

  const addComment = (demId: string, text: string) => {
    if (!currentUser) {
      window.alert(tr.people?.selectCurrentUser || 'Selecciona o crea una persona para continuar.');
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    setComments((prev) => {
      const current = prev[demId] || [];
      return {
        ...prev,
        [demId]: [...current, { auteur: currentUser, date: now, texte: trimmed }],
      };
    });

    setDemandes((prev) => prev.map((item) => (item.id === demId ? { ...item, derniereMaj: now } : item)));
    setCommentDraft('');
  };

  const changeStatut = (demId: string, newStatut: string, reponse: string) => {
    if (!currentUser) {
      window.alert(tr.people?.selectCurrentUser || 'Selecciona o crea una persona para continuar.');
      return;
    }

    const now = new Date().toISOString();
    const statusValue = (newStatut === 'Reouvrir' ? 'Nouveau' : newStatut) as DemandeStatus;

    setDemandes((prev) => prev.map((item) => {
      if (item.id !== demId) return item;
      const isResolved = ['Clos', 'Resolu (propose)', 'Rejete (confirme)'].includes(statusValue);
      const reopened = statusValue === 'Nouveau';

      return {
        ...item,
        statut: statusValue,
        derniereMaj: now,
        reponse: reponse ? reponse : reopened ? '' : item.reponse,
        dateResolution: reopened ? null : isResolved ? now : item.dateResolution,
      };
    }));

    if (reponse.trim()) {
      setComments((prev) => {
        const current = prev[demId] || [];
        return {
          ...prev,
          [demId]: [...current, { auteur: currentUser, date: now, texte: `[Statut -> ${statusValue}] ${reponse.trim()}` }],
        };
      });
    }

    setStatusAction(null);
    setStatusReason('');
  };

  const renderDashboard = () => {
    const criticalLate = lateDem.filter((item) => daysSince(item.derniereMaj) >= 14);

    return (
      <>
        {lateDem.length > 0 && (
          <div className={`alert-banner ${criticalLate.length > 0 ? 'crit' : 'warn'}`}>
            <span style={{ fontSize: 18 }}>{criticalLate.length > 0 ? '🔴' : '⚠️'}</span>
            <span>
              <strong>{lateDem.length}</strong> {requestWord(lateDem.length)} {tr.alerts?.lateSuffix || 'en retard'}
              {criticalLate.length > 0 && (
                <>
                  {' '}{tr.alerts?.criticalPrefix || 'dont'} <strong style={{ color: 'var(--danger)' }}>{criticalLate.length} {criticalWord(criticalLate.length)}</strong> ({tr.alerts?.criticalWindow || '14+ jours'})
                </>
              )}
            </span>
          </div>
        )}

        <div className="stats">
          <div className="stat-card" data-color="info">
            <div className="stat-label">📬 {tr.stats?.open || 'Ouvertes'}</div>
            <div className="stat-value info">{openDem.length}</div>
          </div>
          <div className="stat-card" data-color="warning">
            <div className="stat-label">⚠️ {tr.stats?.late || 'En retard'}</div>
            <div className="stat-value warning">{lateDem.length}</div>
          </div>
          <div className="stat-card" data-color="accent">
            <div className="stat-label">✅ {tr.stats?.resolvedWeek || 'Resolues (7j)'}</div>
            <div className="stat-value accent">{resolvedWeek.length}</div>
          </div>
          <div className="stat-card" data-color="purple">
            <div className="stat-label">⏱ {tr.stats?.avgResolution || 'Resolution moy.'}</div>
            <div className="stat-value purple">{avgResolution}</div>
          </div>
        </div>

        <div className="section-title">{tr.sections?.openByStatus || 'Demandes ouvertes par statut'}</div>
        <div className="status-grid">
          {(['Nouveau', 'En cours', 'En attente', 'Resolu (propose)', 'Rejete (propose)'] as DemandeStatus[]).map((status) => {
            const count = openDem.filter((item) => item.statut === status).length;
            const color = STATUT_COLORS[status];
            return (
              <button
                key={status}
                type="button"
                className="status-tile"
                style={{ borderColor: `${color}50` }}
                onClick={() => {
                  setView('list');
                  setFilterView('all');
                  setFilterStatut(status);
                  setSelectedId(null);
                }}
              >
                <div className="num" style={{ color }}>{count}</div>
                <div className="lbl">{getStatusLabel(status)}</div>
              </button>
            );
          })}
        </div>

        {lateDem.length > 0 && (
          <>
            <div className="section-title warn">⚠ {tr.sections?.lateRequests || 'Demandes en retard'}</div>
            {[...lateDem]
              .sort((a, b) => new Date(a.derniereMaj).getTime() - new Date(b.derniereMaj).getTime())
              .map((item) => {
                const days = daysSince(item.derniereMaj);
                const critical = days >= 14;
                return (
                  <div
                    key={item.id}
                    className={`late-row ${critical ? 'crit-border' : 'warn-border'}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setStatusAction(null);
                      setStatusReason('');
                    }}
                  >
                    <PriorityDot priority={item.priorite} />
                    <span className="dem-id">{item.id}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{item.titre}</span>
                    <Badge label={`${days}${dayShort}`} color={critical ? '#ef4444' : '#f59e0b'} small />
                  </div>
                );
              })}
          </>
        )}

        <div className="section-title" style={{ marginTop: 26 }}>{tr.sections?.topDeclarants || 'Top declarants'}</div>
        <div className="declarants">
          {topDeclarants.length === 0 ? (
            <div className="empty small">{tr.sections?.noTopDeclarants || 'Sin registros todavia.'}</div>
          ) : topDeclarants.map(([name, count]) => (
            <div key={name} className="declarant-chip">
              <strong>{name}</strong> - {count} {requestWord(count)}
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderList = () => {
    if (filteredDemandes.length === 0) {
      const emptyMessage = demandes.length === 0
        ? (tr.filters?.noTasksYet || 'Aun no hay tareas. Crea la primera solicitud para empezar.')
        : (tr.filters?.noResults || 'Aucune demande trouvee.');

      return (
        <>
          <div className="filters">
            <input placeholder={tr.filters?.searchPlaceholder || '🔍 Rechercher...'} value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="select-sm" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
              <option value={ALL_FILTER_VALUE}>{tr.filters?.allStatus || 'Tous'}</option>
              {STATUTS.map((status) => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
            <select className="select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value={ALL_FILTER_VALUE}>{tr.filters?.allType || 'Tous'}</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div className="empty">{emptyMessage}</div>
        </>
      );
    }

    return (
      <>
        <div className="filters">
          <input placeholder={tr.filters?.searchPlaceholder || '🔍 Rechercher...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select-sm" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value={ALL_FILTER_VALUE}>{tr.filters?.allStatus || 'Tous'}</option>
            {STATUTS.map((status) => (
              <option key={status} value={status}>{getStatusLabel(status)}</option>
            ))}
          </select>
          <select className="select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value={ALL_FILTER_VALUE}>{tr.filters?.allType || 'Tous'}</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>{getTypeLabel(type)}</option>
            ))}
          </select>
        </div>

        {filteredDemandes.map((item) => {
          const days = daysSince(item.derniereMaj);
          const late = days >= 7 && !['Clos', 'Rejete (confirme)'].includes(item.statut);
          const critical = days >= 14 && late;
          const totalComments = comments[item.id]?.length || 0;

          return (
            <div
              key={item.id}
              className={`dem-row ${late ? (critical ? 'critical-late' : 'late') : ''}`}
              onClick={() => {
                setSelectedId(item.id);
                setStatusAction(null);
                setStatusReason('');
                setCommentDraft('');
              }}
            >
              <div className="dem-top">
                <PriorityDot priority={item.priorite} />
                <span className="dem-id">{item.id}</span>
                <span className="dem-title">{TYPE_ICON[item.type]} {item.titre}</span>
                <Badge label={getStatusLabel(item.statut)} color={STATUT_COLORS[item.statut] || '#5a6a8a'} small />
                {late ? <Badge label={critical ? `14+${dayShort}` : `7+${dayShort}`} color={critical ? '#ef4444' : '#f59e0b'} small /> : null}
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteDemande(item.id);
                  }}
                  title={tr.actions?.deleteTask || 'Eliminar tarea'}
                >
                  ✕
                </button>
              </div>
              <div className="dem-meta">
                <span>{item.declarePar}</span>
                <span>→ {item.assigneA || (tr.detail?.unassigned || 'Sin asignar')}</span>
                <span>{fmtDate(item.derniereMaj, activeLocale)}</span>
                <span>{totalComments} {(tr.common?.commentsShort || '💬')}</span>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const renderDetail = (item: Demande) => {
    const days = daysSince(item.derniereMaj);
    const late = days >= 7 && !['Clos', 'Rejete (confirme)'].includes(item.statut);
    const critical = days >= 14 && late;
    const closed = ['Clos', 'Rejete (confirme)'].includes(item.statut);
    const itemComments = comments[item.id] || [];
    const actions = possibleActions(item);

    return (
      <>
        <button
          type="button"
          className="back-link"
          onClick={() => {
            setSelectedId(null);
            setStatusAction(null);
            setStatusReason('');
            setCommentDraft('');
          }}
        >
          ← {tr.detail?.backToList || 'Retour aux demandes'}
        </button>

        <div className={`detail-card ${late ? (critical ? 'crit-border' : 'late-border') : ''}`}>
          <div className="detail-badges">
            <span className="dem-id">{item.id}</span>
            <PriorityDot priority={item.priorite} />
            <Badge label={getTypeLabel(item.type)} color={STATUT_COLORS['En cours']} small />
            <Badge label={getStatusLabel(item.statut)} color={STATUT_COLORS[item.statut] || '#5a6a8a'} />
            {late ? <Badge label={critical ? (tr.detail?.criticalLate || 'CRITIQUE - 14+ jours') : (tr.detail?.late || 'En retard - 7+ jours')} color={critical ? '#ef4444' : '#f59e0b'} small /> : null}
          </div>

          <div className="detail-title">{TYPE_ICON[item.type]} {item.titre}</div>
          <div className="detail-desc">{item.description}</div>

          <div className="detail-meta">
            <span>{tr.detail?.declaredBy || 'Declare par'} <strong>{item.declarePar}</strong></span>
            <span>{tr.detail?.assignedTo || 'Assigne a'} <strong>{item.assigneA || (tr.detail?.unassigned || 'Sin asignar')}</strong></span>
            <span>{tr.detail?.createdOn || 'Cree le'} {fmtDate(item.dateCreation, activeLocale)}</span>
            <span>{tr.detail?.updatedOn || 'Derniere maj'} {fmtDate(item.derniereMaj, activeLocale)}</span>
          </div>

          <div className="assignment-row">
            <label className="form-label">{tr.detail?.reassignTo || 'Reasignar a'}</label>
            <select
              value={item.assigneA}
              onChange={(e) => reassignDemande(item.id, e.target.value)}
            >
              <option value="">{tr.detail?.unassigned || 'Sin asignar'}</option>
              {item.assigneA && !allPeopleNames.includes(item.assigneA) ? (
                <option value={item.assigneA}>{item.assigneA} ({tr.people?.deletedTag || 'eliminado'})</option>
              ) : null}
              {assignablePeopleNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {item.reponse ? (
            <div className="response-box">
              <div className="lbl">{tr.detail?.response || 'Reponse'}</div>
              <div className="txt">{item.reponse}</div>
            </div>
          ) : null}

          <div className="actions-bar">
            {actions.map((action) => {
              const color = (STATUT_COLORS as Record<string, string>)[action] || '#10b981';
              return (
                <button
                  key={action}
                  type="button"
                  className="btn-status"
                  style={{
                    color,
                    borderColor: `${color}50`,
                    background: `${color}18`,
                  }}
                  onClick={() => {
                    if (['Resolu (propose)', 'Rejete (propose)', 'En attente'].includes(action)) {
                      setStatusAction(action);
                      setStatusReason('');
                    } else {
                      changeStatut(item.id, action, '');
                    }
                  }}
                >
                  → {getActionLabel(action)}
                </button>
              );
            })}
            <button
              type="button"
              className="btn-status danger"
              onClick={() => deleteDemande(item.id)}
            >
              {tr.actions?.deleteTask || 'Eliminar tarea'}
            </button>
          </div>

          {statusAction ? (
            <div style={{ marginTop: 14 }}>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={statusAction === 'En attente' ? (tr.actions?.blockedReason || 'Raison du blocage...') : (tr.actions?.statusReason || 'Reponse / justification...')}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => {
                  if (statusReason.trim()) {
                    changeStatut(item.id, statusAction, statusReason);
                  }
                }}
              >
                {tr.actions?.confirm || 'Confirmer'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginLeft: 6 }}
                onClick={() => {
                  setStatusAction(null);
                  setStatusReason('');
                }}
              >
                {tr.actions?.cancel || 'Annuler'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="comment-thread">
          <h3>{tr.detail?.thread || 'Fil de discussion'} ({itemComments.length})</h3>

          {itemComments.length === 0 ? (
            <div className="empty" style={{ padding: '20px 0' }}>{tr.detail?.noComments || 'Aucun commentaire pour l\'instant.'}</div>
          ) : itemComments.map((entry, index) => {
            const teamUser = isTeam(entry.auteur, people);
            return (
              <div key={`${entry.date}-${index}`} className={`comment ${teamUser ? 'team' : 'client'}`}>
                <div className="comment-header">
                  <span className={teamUser ? 'comment-author-team' : 'comment-author-client'}>{entry.auteur}</span>
                  <span className="comment-date">{fmtDateTime(entry.date, activeLocale)}</span>
                </div>
                <div className="comment-text">{entry.texte}</div>
              </div>
            );
          })}
        </div>

        {!closed ? (
          <div className="comment-input">
            <input
              placeholder={tr.detail?.commentPlaceholder || 'Ajouter un commentaire...'}
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentDraft.trim()) {
                  addComment(item.id, commentDraft);
                }
              }}
            />
            <button type="button" className="btn btn-accent" onClick={() => addComment(item.id, commentDraft)}>
              {tr.detail?.send || 'Envoyer'}
            </button>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className="suivi-demandes-page" translate="no" data-no-translate="true">
      <div className="app">
        {isLoading ? (
          <div className="loading">{tr.common?.loading || 'Chargement du suivi des demandes...'}</div>
        ) : loadError ? (
          <div className="error-box">
            {loadError}
            <div>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/context')}>
                {tr.common?.backToServer || 'Retour au serveur'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" className="server-back-link" onClick={() => navigate('/dashboard/context')}>
              ← {tr.common?.backToServer || 'Volver al servidor'}
            </button>

            <header className="header">
              <div className="header-brand">
                <div className="header-logo">AI</div>
                <div>
                  <div className="header-title">{tr.header?.title || 'Suivi des Demandes'}</div>
                  <div className="header-sub">{tr.header?.subtitle || 'AI Maker Fablab'}</div>
                </div>
              </div>
              <div className="header-actions">
                <select
                  className="select-sm"
                  value={currentUser}
                  onChange={(e) => handleCurrentUserChange(e.target.value)}
                  disabled={people.length === 0}
                >
                  {people.length === 0 ? <option value="">{tr.people?.emptyUsers || 'Sin personas'}</option> : null}
                  {people.map((person) => (
                    <option key={person.id} value={person.name}>{person.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPeoplePanel((prev) => !prev)}>
                  👥 {tr.people?.manage || 'Personas'}
                </button>
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={!currentUser}
                  onClick={openCreateForm}
                >
                  + {tr.common?.newRequest || 'Nouvelle'}
                </button>
              </div>
            </header>

            {currentUser ? (
              <section className="active-user-strip">
                <div className="active-user-main">
                  <span className="kicker">{tr.people?.activeUserLabel || 'Persona activa'}</span>
                  <strong>{currentUser}</strong>
                  <span className="hint">{tr.people?.activeUserHint || 'Esta persona declara, comenta y se usa en Mis demandas.'}</span>
                </div>
                <div className="active-user-stats">
                  <span>{tr.people?.declaredCount || 'Declaradas'}: <strong>{activeUserStats.declared}</strong></span>
                  <span>{tr.people?.assignedCount || 'Asignadas'}: <strong>{activeUserStats.assigned}</strong></span>
                  <button type="button" className="btn btn-ghost" onClick={focusCurrentUserTasks}>
                    {tr.people?.viewMine || 'Ver mis tareas'}
                  </button>
                </div>
              </section>
            ) : null}

            {showPeoplePanel ? (
              <section className="people-panel">
                <div className="people-header">
                  <h3>{tr.people?.title || 'Gestion de personas'}</h3>
                  <span>{people.length} {tr.people?.peopleCount || 'personas'}</span>
                </div>

                <div className="people-form">
                  <input
                    value={personForm.name}
                    onChange={(e) => setPersonForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={tr.people?.namePlaceholder || 'Nombre'}
                  />
                  <input
                    value={personForm.role}
                    onChange={(e) => setPersonForm((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder={tr.people?.rolePlaceholder || 'Rol'}
                  />
                  <select
                    value={personForm.scope}
                    onChange={(e) => setPersonForm((prev) => ({ ...prev, scope: e.target.value as PersonScope }))}
                  >
                    <option value="team">{tr.people?.scope?.team || 'Equipo'}</option>
                    <option value="client">{tr.people?.scope?.client || 'Cliente'}</option>
                  </select>
                  <button type="button" className="btn btn-accent" onClick={addPerson}>
                    + {tr.people?.add || 'Agregar'}
                  </button>
                </div>

                {people.length === 0 ? (
                  <div className="empty small">{tr.people?.empty || 'Aun no hay personas. Crea la primera para comenzar.'}</div>
                ) : (
                  <div className="people-list">
                    {people.map((person) => (
                      <div key={person.id} className="person-item">
                        <div className="person-main">
                          <strong>{person.name}</strong>
                          <span>{person.role || DEFAULT_ROLE_BY_SCOPE[person.scope]}</span>
                        </div>
                        <div className="person-actions">
                          <Badge
                            label={person.scope === 'team' ? (tr.people?.scope?.team || 'Equipo') : (tr.people?.scope?.client || 'Cliente')}
                            color={person.scope === 'team' ? '#10b981' : '#3b82f6'}
                            small
                          />
                          {person.name === currentUser ? <Badge label={tr.people?.active || 'Activa'} color="#f59e0b" small /> : null}
                          <button
                            type="button"
                            className="btn-icon danger"
                            onClick={() => deletePerson(person.id)}
                            title={tr.people?.delete || 'Eliminar persona'}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            <nav className="nav">
              <button
                type="button"
                className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setView('dashboard');
                  setFilterView('all');
                  setSelectedId(null);
                  resetFilters();
                }}
              >
                📊 {tr.nav?.dashboard || 'Tableau de bord'}
              </button>
              <button
                type="button"
                className={`nav-tab ${view === 'list' && filterView === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setView('list');
                  setFilterView('all');
                  setSelectedId(null);
                  resetFilters();
                }}
              >
                📋 {tr.nav?.all || 'Toutes'}
              </button>
              <button
                type="button"
                className={`nav-tab ${view === 'list' && filterView === 'mine' ? 'active' : ''}`}
                onClick={() => {
                  setView('list');
                  setFilterView('mine');
                  setSelectedId(null);
                  resetFilters();
                }}
              >
                👤 {tr.nav?.mine || 'Mes demandes'}
              </button>
              <button
                type="button"
                className={`nav-tab ${view === 'list' && filterView === 'waiting' ? 'active' : ''}`}
                onClick={() => {
                  setView('list');
                  setFilterView('waiting');
                  setSelectedId(null);
                  resetFilters();
                }}
              >
                ⏳ {tr.nav?.waiting || 'En attente'}
                {waitingCount > 0 ? <span className="count">{waitingCount}</span> : null}
              </button>
            </nav>

            {selectedDemande ? renderDetail(selectedDemande) : (view === 'dashboard' ? renderDashboard() : renderList())}

            {showForm ? (
              <div className="modal-overlay" onClick={() => setShowForm(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{tr.modal?.title || 'Nouvelle Demande'}</h2>
                    <button type="button" className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr.modal?.titleLabel || 'Titre *'}</label>
                    <input
                      value={formState.titre}
                      onChange={(e) => setFormState((prev) => ({ ...prev, titre: e.target.value }))}
                      placeholder={tr.modal?.titlePlaceholder || 'Description courte du probleme...'}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{tr.modal?.typeLabel || 'Type *'}</label>
                      <select
                        value={formState.type}
                        onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value as DemandeType }))}
                      >
                        {TYPES.map((type) => (
                          <option key={type} value={type}>{TYPE_ICON[type]} {getTypeLabel(type)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{tr.modal?.priorityLabel || 'Priorite *'}</label>
                      <select
                        value={String(formState.priorite)}
                        onChange={(e) => setFormState((prev) => ({ ...prev, priorite: Number(e.target.value) }))}
                      >
                        {PRIORITIES.map((priority) => (
                          <option key={priority.val} value={priority.val}>{getPriorityLabel(priority.val)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr.modal?.declaredByLabel || 'Declarada por'}</label>
                    <input value={currentUser || (tr.people?.emptyUsers || 'Sin personas')} disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr.modal?.assignedLabel || 'Assigne a'}</label>
                    <select
                      value={formState.assigneA}
                      onChange={(e) => setFormState((prev) => ({ ...prev, assigneA: e.target.value }))}
                      disabled={assignablePeopleNames.length === 0}
                    >
                      {assignablePeopleNames.length === 0 ? (
                        <option value="">{tr.detail?.unassigned || 'Sin asignar'}</option>
                      ) : null}
                      {assignablePeopleNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <div className="form-help">{tr.modal?.assignmentHint || 'Si la persona activa pertenece al equipo, se asigna por defecto.'}</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{tr.modal?.descriptionLabel || 'Description *'}</label>
                    <textarea
                      rows={5}
                      value={formState.description}
                      onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder={tr.modal?.descriptionPlaceholder || 'Detail du probleme, contexte, etapes pour reproduire (si bug)...'}
                    />
                  </div>

                  <button type="button" className="btn btn-accent" style={{ width: '100%' }} onClick={createDemande}>
                    {tr.modal?.submit || 'Creer la demande'}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default SuiviDemandesView;
