import { useEffect, useState, useCallback } from 'react';
import { 
  bitacoraService, 
  type BitacoraItem, 
  type BitacoraParams 
} from '../services/bitacora.service';

export function useBitacora() {
  const [logs, setLogs] = useState<BitacoraItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<BitacoraParams>({ page: 1, limit: 15 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bitacoraService.getLogs(params);
      setLogs(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error al cargar la bitácora:', error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({ ...prev, search: searchTerm.trim() || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePrevPage = () => {
    setParams(prev => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) }));
  };

  const handleNextPage = () => {
    setParams(prev => ({ ...prev, page: Math.min((prev.page || 1) + 1, meta.totalPages) }));
  };

  return {
    logs,
    meta,
    loading,
    params,
    searchTerm,
    setSearchTerm,
    fetchLogs,
    handlePrevPage,
    handleNextPage,
  };
}
