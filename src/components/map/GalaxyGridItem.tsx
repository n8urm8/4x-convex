interface GalaxyGridItemProps {
  x: number;
  y: number;
  isSelected: boolean;
  setSelectedSector: (sector: { x: number; y: number }) => void;
}

export const GalaxyGridItem = ({
  x,
  y,
  isSelected,
  setSelectedSector
}: GalaxyGridItemProps) => {
  return (
    <div
      key={`${x}-${y}`}
      className={`border aspect-square p-2 ${isSelected ? 'border-blue-500' : 'border-gray-200/25'}`}
      onClick={() => setSelectedSector({ x, y })}
    >
      Sector ({x}, {y})
    </div>
  );
};
