'use client';

import UsuarioCard from './UsuarioCard';
import type { GrupoConDetalles } from '@/types';

interface GrupoPrincipalCardProps {
  grupo: GrupoConDetalles;
  tieneCargos: boolean;
  onEditUsuario: (id_usuario: number, grupo: GrupoConDetalles) => void;
  onDeleteUsuario: (id_usuario: number, grupo: GrupoConDetalles) => void;
}

//Paleta de colores azules estándar (Tailwind-like blue tones)
const borderColors = [
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A',
  '#0EA5E9', '#0284C7', '#0369A1', '#075985', '#0C4A6E'
];

function getBorderColor(id_grupo: number): string {
  return borderColors[id_grupo % borderColors.length];
}

export default function GrupoPrincipalCard({ grupo, tieneCargos, onEditUsuario, onDeleteUsuario }: GrupoPrincipalCardProps) {
  const borderColor = tieneCargos ? '#DC2626' : getBorderColor(grupo.id_grupo);

  return (
    <div className="bg-white shadow-md rounded-lg mb-4 border-l-4" style={{ borderLeftColor: borderColor }}>
      {/* Encabezado del grupo */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-800">
            Grupo #{grupo.id_grupo}
          </h3>
          {tieneCargos && (
            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full" title="Este grupo ya tiene cargos generados">
              Con pagos — Grupo bloqueado
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {grupo.usuarios.length} {grupo.usuarios.length === 1 ? 'integrante' : 'integrantes'}
        </p>
      </div>

      {/* Lista de usuarios */}
      <div className="px-3 pb-3">
        {grupo.usuarios.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Sin integrantes</p>
        ) : (
          grupo.usuarios.map((usuario) => (
            <UsuarioCard
              key={usuario.id}
              usuario={usuario}
              tieneCargos={tieneCargos}
              onEdit={(idUsuario) => onEditUsuario(idUsuario, grupo)}
              onDelete={(idUsuario) => onDeleteUsuario(idUsuario, grupo)}
            />
          ))
        )}
      </div>
    </div>
  );
}
