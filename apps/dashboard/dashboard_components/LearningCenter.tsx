import React from 'react';
import { Book, Eye, ExternalLink } from 'lucide-react';
import { TYPE_CONFIG } from '../constants';
import './styles/LearningCenter.css';

interface Author {
  name: string;
  avatar: string;
  date: string;
}

interface LearningResource {
  id: string;
  type: string;
  name: string;
  description: string;
  author: Author;
  link: string;
}

const LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'l1',
    type: 'PROJECT',
    name: 'Project Menuisier IA',
    description: "Application d'assistance pour la menuiserie avec IA.",
    author: {
      name: 'Fablab Admin',
      avatar: 'https://picsum.photos/seed/admin/40/40',
      date: '01/01/2024'
    },
    link: '#'
  },
  {
    id: 'l2',
    type: 'PROJECT',
    name: 'Project Porcoroso',
    description: 'Rifa de cerdo navideño. Gestion et automatisation de loterie.',
    author: {
      name: 'Fablab Admin',
      avatar: 'https://picsum.photos/seed/admin/40/40',
      date: '05/01/2024'
    },
    link: '#'
  },
  {
    id: 'l3',
    type: 'PROJECT',
    name: 'RenovateHouseAI',
    description: "Application d'assistance pour la renovation de maisons avec IA.",
    author: {
      name: 'Fablab Admin',
      avatar: 'https://picsum.photos/seed/admin/40/40',
      date: '10/01/2024'
    },
    link: '#'
  },
  {
    id: 'l4',
    type: 'PROJECT',
    name: 'polyglot-ai-tutor',
    description: 'Application pour apprendre les langues avec IA et feedback en temps réel.',
    author: {
      name: 'Fablab Admin',
      avatar: 'https://picsum.photos/seed/admin/40/40',
      date: '15/01/2024'
    },
    link: '#'
  }
];

const LearningCenter: React.FC = () => {
  return (
    <div className="learning-center">
      <div className="learning-center__header">
        <div className="learning-center__icon-wrapper">
          <Book size={32} />
        </div>
        <h1 className="learning-center__title">Centre d'Apprentissage</h1>
        <p className="learning-center__subtitle">
          Développez vos compétences et maîtrisez tous les outils du AIMaker Fablab grâce à nos guides interactifs.
        </p>
      </div>

      <div className="learning-center__card">
        <div className="learning-center__table-wrapper">
          <table className="learning-center__table">
            <thead className="learning-center__thead">
              <tr>
                <th className="learning-center__th">Type</th>
                <th className="learning-center__th">Exemple & Objectif</th>
                <th className="learning-center__th">Action</th>
                <th className="learning-center__th learning-center__th--center">Ressource</th>
                <th className="learning-center__th">Auteur / Date</th>
              </tr>
            </thead>
            <tbody className="learning-center__tbody">
              {LEARNING_RESOURCES.map((resource) => {
                const config = TYPE_CONFIG[resource.type];
                return (
                  <tr key={resource.id} className="learning-center__tr">
                    <td className="learning-center__td learning-center__td--type">
                      <div className="learning-center__type-cell">
                        <div className="learning-center__type-icon" style={{ backgroundColor: config.bg, color: config.color }}>
                          {config.icon}
                        </div>
                        <span className="learning-center__type-label" style={{ color: config.color }}>
                          {resource.type}
                        </span>
                      </div>
                    </td>
                    <td className="learning-center__td learning-center__td--content">
                      <h3 className="learning-center__resource-name">{resource.name}</h3>
                      <p className="learning-center__resource-desc">{resource.description}</p>
                    </td>
                    <td className="learning-center__td">
                      <button className="learning-center__action-btn">
                        <Eye size={16} />
                        <span>Suivre le guide</span>
                      </button>
                    </td>
                    <td className="learning-center__td learning-center__td--center">
                      <a href={resource.link} className="learning-center__link-btn">
                        <ExternalLink size={20} />
                      </a>
                    </td>
                    <td className="learning-center__td">
                      <div className="learning-center__author">
                        <img
                          src={resource.author.avatar}
                          alt={resource.author.name}
                          className="learning-center__author-avatar"
                        />
                        <div className="learning-center__author-info">
                          <span className="learning-center__author-name">{resource.author.name}</span>
                          <span className="learning-center__author-date">{resource.author.date}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="learning-center__banner">
        <div className="learning-center__banner-icon">
          <Book size={20} />
        </div>
        <div className="learning-center__banner-content">
          <p className="learning-center__banner-title">Nouveaux guides disponibles chaque semaine</p>
          <p className="learning-center__banner-desc">Apprenez à maîtriser les agents RAG et les prompts structurés avec nos derniers tutoriels.</p>
        </div>
      </div>
    </div>
  );
};

export default LearningCenter;
