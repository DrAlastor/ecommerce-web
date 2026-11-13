import { describe, it, expect, vi } from 'vitest';
import { ReportsAiService } from './reports-ai.service.js';

describe('Listas por voz', () => {
  for (const question of ['muéstrame la lista de productos más vendidos', 'qué sucursal vendió más hoy']) {
    it(question, async () => {
      const query = vi.fn().mockResolvedValue([{nombre:'Nombre real', unidades:12, importe:180}]);
      const service = Object.create(ReportsAiService.prototype) as ReportsAiService;
      Object.assign(service, {prisma:{$queryRawUnsafe:query},qbeService:{authorizedScope:async()=>({isGlobal:true,branchIds:[]})}});
      const response = await service.processChat({message:question}, {id_rol:1,id_usuario:1});
      expect(response.reply).toContain('Nombre real: 12 unidades');
      expect(response.queryResult?.rows[0].nombre).toBe('Nombre real');
      expect(response.queryResult?.columns[0].key).toBe('nombre');
      if (question.includes('hoy')) expect(query.mock.calls[0][0]).toContain('America/La_Paz');
    });
  }
});
