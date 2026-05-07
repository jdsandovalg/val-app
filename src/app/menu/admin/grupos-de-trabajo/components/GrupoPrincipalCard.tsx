'use client';

import UsuarioCard from './UsuarioCard';
import type { GrupoConDetalles } from '@/types';

interface GrupoPrincipalCardProps {
  grupo: GrupoConDetalles;
  tieneCargos: boolean;
  onEditUsuario: (id_usuario: number, grupo: GrupoConDetalles) => void;
  onDeleteUsuario: (id_usuario: number, grupo: GrupoConDetalles) => void;
}

const colorToClassMap: { [key: string]: string } = {
  red: 'border-red-500',
  green: 'border-green-500',
  blue: 'border-blue-500',
  yellow: 'border-yellow-500',
  purple: 'border-purple-500',
  pink: 'border-pink-500',
  indigo: 'border-indigo-500',
  teal: 'border-teal-500',
};

const colorKeys = Object.keys(colorToClassMap);

function getBorderColorClass(id_grupo: number): string {
  const index = id_grupo % colorKeys.length;
  return colorToClassMap[colorKeys[index]];
}

export default function GrupoPrincipalCard({ grupo, tieneCargos, onEditUsuario, onDeleteUsuario }: GrupoPrincipalCardProps) {
  // Si tiene cargos → rojo fijo, sino → color cíclico de la paleta
  const borderColorClass = tieneCargos ? getBorderColorClass(grupo.id_grupo) : getBorderColorClass(grupo.id_grupo);

  return (
    <div className={`bg-white shadow-md rounded-lg mb-4 border-l-4 ${borderColorClass}`}>
      {/* Encabezado del grupo */}
      <div className="p-2">
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
      <div className="px-2 pb-2">
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
