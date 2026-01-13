import { Share2, Globe, Users, Eye } from 'lucide-react';
import { RESOURCES, TYPE_CONFIG } from '../constants';
import './styles/SharedResources.css';

const SharedResources = () => {
    // Only show resources that are not PRIVATE
    const sharedResources = RESOURCES.filter((r: any) => r.visibility && r.visibility !== 'PRIVATE');

    return (
        <div className="shared-resources">
            <div className="shared-resources__header">
                <div className="shared-resources__header-content">
                    <h1 className="shared-resources__title">Espace Partagé</h1>
                    <p className="shared-resources__subtitle">Retrouvez toutes les créations partagées avec la communauté ou vos équipes.</p>
                </div>
            </div>

            <div className="shared-resources__table-wrapper">
                <table className="shared-resources__table">
                    <thead className="shared-resources__thead">
                        <tr>
                            <th className="shared-resources__th">Type</th>
                            <th className="shared-resources__th">Nom & Description</th>
                            <th className="shared-resources__th">Partagé avec</th>
                            <th className="shared-resources__th">Détails</th>
                            <th className="shared-resources__th">Propriétaire</th>
                        </tr>
                    </thead>
                    <tbody className="shared-resources__tbody">
                        {sharedResources.length > 0 ? (
                            sharedResources.map((resource: any) => {
                                const config = TYPE_CONFIG[resource.type];
                                return (
                                    <tr key={resource.id} className="shared-resources__row">
                                        <td className="shared-resources__td shared-resources__td--top">
                                            <div className="shared-resources__type-cell">
                                                <div className={`shared-resources__type-icon ${config.bg} ${config.color}`}>
                                                    {config.icon}
                                                </div>
                                                <span className={`shared-resources__type-label ${config.color}`}>
                                                    {resource.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="shared-resources__td shared-resources__td--top shared-resources__td--wide">
                                            <h3 className="shared-resources__resource-name">
                                                {resource.name}
                                            </h3>
                                            <p className="shared-resources__resource-description">
                                                {resource.description}
                                            </p>
                                        </td>
                                        <td className="shared-resources__td shared-resources__td--top">
                                            <div className="shared-resources__visibility-cell">
                                                <div className="shared-resources__visibility-wrapper">
                                                    {resource.visibility === 'PUBLIC' ? (
                                                        <div className="shared-resources__visibility-badge shared-resources__visibility-badge--public">
                                                            <Globe size={12} />
                                                            <span>Public</span>
                                                        </div>
                                                    ) : (
                                                        <div className="shared-resources__visibility-badge shared-resources__visibility-badge--team">
                                                            <Users size={12} />
                                                            <span>Équipes</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {resource.sharedWith && (
                                                    <div className="shared-resources__teams-list">
                                                        {resource.sharedWith.map((team: string) => (
                                                            <span key={team} className="shared-resources__team-tag">
                                                                {team}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="shared-resources__td shared-resources__td--top">
                                            <button className="shared-resources__view-btn">
                                                <Eye size={16} />
                                                <span>Consulter</span>
                                            </button>
                                        </td>
                                        <td className="shared-resources__td shared-resources__td--top">
                                            <div className="shared-resources__author">
                                                <img
                                                    src={resource.author.avatar}
                                                    alt={resource.author.name}
                                                    className="shared-resources__author-avatar"
                                                />
                                                <div className="shared-resources__author-info">
                                                    <span className="shared-resources__author-name">{resource.author.name}</span>
                                                    <span className="shared-resources__author-date">{resource.author.date}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="shared-resources__td shared-resources__td--empty">
                                    <div className="shared-resources__empty-state">
                                        <Share2 size={48} className="shared-resources__empty-icon" />
                                        <p className="shared-resources__empty-text">Aucune ressource partagée</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SharedResources;
