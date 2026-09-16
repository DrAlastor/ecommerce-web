import React, { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../../services/catalog-admin.service';
import { SeasonModal } from './SeasonModal';
import { CollectionModal } from './CollectionModal';
import type { AdminSeason, AdminCollection } from '../../types/catalog-admin.types';

interface SeasonCollectionTabProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshMetadata: () => void;
}

export const SeasonCollectionTab: React.FC<SeasonCollectionTabProps> = ({
  onFeedback,
  onRefreshMetadata,
}) => {
  const [seasons, setSeasons] = useState<AdminSeason[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(false);

  const [seasonModalOpen, setSeasonModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<AdminSeason | null>(null);

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<AdminCollection | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        catalogAdminService.getSeasons(),
        catalogAdminService.getCollections(),
      ]);
      setSeasons(sData);
      setCollections(cData);
    } catch (err: any) {
      onFeedback('error', 'Error al cargar temporadas y colecciones.');
    } finally {
      setLoading(false);
    }
  }, [onFeedback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Seasons
  const handleCreateOrUpdateSeason = async (data: any) => {
    if (selectedSeason) {
      await catalogAdminService.updateSeason(selectedSeason.id_temporada, data);
      onFeedback('success', 'Temporada actualizada exitosamente.');
    } else {
      await catalogAdminService.createSeason(data);
      onFeedback('success', 'Temporada creada exitosamente.');
    }
    fetchData();
    onRefreshMetadata();
  };

  // Collections
  const handleCreateOrUpdateCollection = async (data: any) => {
    if (selectedCollection) {
      await catalogAdminService.updateCollection(selectedCollection.id_coleccion, data);
      onFeedback('success', 'Colección actualizada exitosamente.');
    } else {
      await catalogAdminService.createCollection(data);
      onFeedback('success', 'Colección creada exitosamente.');
    }
    fetchData();
    onRefreshMetadata();
  };

  const handleDeleteCollection = async (col: AdminCollection) => {
    if (!window.confirm(`¿Estás seguro de eliminar la colección "${col.nombre}"?`)) return;
    try {
      await catalogAdminService.deleteCollection(col.id_coleccion);
      onFeedback('success', 'Colección eliminada exitosamente.');
      fetchData();
      onRefreshMetadata();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al eliminar la colección.');
    }
  };

  return (
    <div className="catalog-tab-content">
      <div className="tab-two-columns">
        {/* Panel Izquierdo: TEMPORADAS */}
        <div className="catalog-subpanel">
          <div className="subpanel-header">
            <div>
              <h3>Temporadas ({seasons.length})</h3>
              <p className="subpanel-desc">Campañas comerciales con calendario de vigencia.</p>
            </div>
            <button
              type="button"
              className="admin-btn primary sm"
              onClick={() => {
                setSelectedSeason(null);
                setSeasonModalOpen(true);
              }}
            >
              + Nueva Temporada
            </button>
          </div>

          <div className="seasons-list">
            {loading ? (
              <p>Cargando temporadas...</p>
            ) : seasons.length === 0 ? (
              <p className="text-muted">No hay temporadas registradas.</p>
            ) : (
              seasons.map((s) => (
                <div key={s.id_temporada} className="season-card-box">
                  <div className="season-card-top">
                    <strong className="season-name">{s.nombre}</strong>
                    <span className={`status-pill ${s.estado}`}>{s.estado}</span>
                  </div>
                  <div className="season-dates-row">
                    <span>📅 {new Date(s.fecha_inicio).toLocaleDateString()}</span>
                    <span>→</span>
                    <span>{new Date(s.fecha_fin).toLocaleDateString()}</span>
                  </div>
                  <div className="season-card-bottom">
                    <span className="collection-count-text">
                      {s._count?.coleccion || 0} colecciones asociadas
                    </span>
                    <button
                      type="button"
                      className="admin-btn sm text"
                      onClick={() => {
                        setSelectedSeason(s);
                        setSeasonModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Derecho: COLECCIONES */}
        <div className="catalog-subpanel">
          <div className="subpanel-header">
            <div>
              <h3>Colecciones ({collections.length})</h3>
              <p className="subpanel-desc">Líneas de diseño agrupadas temáticamente bajo una temporada.</p>
            </div>
            <button
              type="button"
              className="admin-btn primary sm"
              onClick={() => {
                setSelectedCollection(null);
                setCollectionModalOpen(true);
              }}
            >
              + Nueva Colección
            </button>
          </div>

          <div className="collections-list">
            {loading ? (
              <p>Cargando colecciones...</p>
            ) : collections.length === 0 ? (
              <p className="text-muted">No hay colecciones registradas.</p>
            ) : (
              collections.map((c) => (
                <div key={c.id_coleccion} className="collection-card-box">
                  <div className="collection-card-top">
                    <div>
                      <strong className="collection-name">{c.nombre}</strong>
                      {c.temporada?.nombre && (
                        <span className="season-parent-badge">🍂 {c.temporada.nombre}</span>
                      )}
                    </div>
                    <span className="count-pill">{c._count?.producto || 0} prendas</span>
                  </div>
                  {c.descripcion && <p className="collection-desc">{c.descripcion}</p>}
                  <div className="collection-card-actions">
                    <button
                      type="button"
                      className="admin-btn sm text"
                      onClick={() => {
                        setSelectedCollection(c);
                        setCollectionModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-btn sm text danger"
                      onClick={() => handleDeleteCollection(c)}
                      disabled={(c._count?.producto || 0) > 0}
                      title={
                        (c._count?.producto || 0) > 0
                          ? 'No se puede eliminar porque tiene productos asociados'
                          : 'Eliminar colección'
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <SeasonModal
        isOpen={seasonModalOpen}
        season={selectedSeason}
        onClose={() => setSeasonModalOpen(false)}
        onSubmit={handleCreateOrUpdateSeason}
      />

      <CollectionModal
        isOpen={collectionModalOpen}
        collection={selectedCollection}
        seasons={seasons}
        onClose={() => setCollectionModalOpen(false)}
        onSubmit={handleCreateOrUpdateCollection}
      />
    </div>
  );
};
