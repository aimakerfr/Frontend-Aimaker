import { ExternalLink, Eye, Search } from 'lucide-react';
import { TYPE_CONFIG } from '../constants';
import './styles/LibraryTable.css';

interface Resource {
  id: string;
  type: string;
  name: string;
  description: string;
  link?: string;
  author: {
    name: string;
    date: string;
    avatar?: string;
  };
}

interface LibraryTableProps {
  resources: Resource[];
  onViewDetails: (resource: Resource) => void;
}

export default function LibraryTable({ resources, onViewDetails }: LibraryTableProps) {
  return (
    <div className="library-table">
      <table className="library-table__table">
        <thead className="library-table__thead">
          <tr>
            <th className="library-table__th">Type</th>
            <th className="library-table__th">Nom & Description</th>
            <th className="library-table__th">Action</th>
            <th className="library-table__th library-table__th--center">Ressource</th>
            <th className="library-table__th">Auteur / Date</th>
          </tr>
        </thead>
        <tbody className="library-table__tbody">
          {resources.length > 0 ? (
            resources.map((resource) => {
              const config = TYPE_CONFIG[resource.type];
              return (
                <tr key={resource.id} className="library-table__row">
                  <td className="library-table__td library-table__td--top library-table__td--center">
                    <div className="library-table__type-cell">
                      <div className={`library-table__type-icon ${config.bg} ${config.color}`}>
                        {config.icon}
                      </div>
                      <span className={`library-table__type-label ${config.color}`}>
                        {resource.type}
                      </span>
                    </div>
                  </td>
                  <td className="library-table__td library-table__td--top library-table__td--wide">
                    <h3 className="library-table__resource-name">{resource.name}</h3>
                    <p className="library-table__resource-description">{resource.description}</p>
                  </td>
                  <td className="library-table__td library-table__td--top">
                    <button
                      onClick={() => onViewDetails(resource)}
                      className="library-table__view-btn"
                    >
                      <Eye size={16} />
                      <span>VOIR DÉTAILS</span>
                    </button>
                  </td>
                  <td className="library-table__td library-table__td--top library-table__td--center">
                    <a
                      href="#"
                      className="library-table__link"
                      title={resource.link}
                    >
                      <ExternalLink size={20} />
                    </a>
                  </td>
                  <td className="library-table__td library-table__td--top">
                    <div className="library-table__author">
                      <img
                        src={resource.author.avatar}
                        alt={resource.author.name}
                        className="library-table__author-avatar"
                      />
                      <div className="library-table__author-info">
                        <span className="library-table__author-name">{resource.author.name}</span>
                        <span className="library-table__author-date">{resource.author.date}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="library-table__td library-table__td--empty">
                <div className="library-table__empty-state">
                  <div className="library-table__empty-icon-wrapper">
                    <Search size={32} />
                  </div>
                  <p className="library-table__empty-text">Aucune ressource trouvée</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
