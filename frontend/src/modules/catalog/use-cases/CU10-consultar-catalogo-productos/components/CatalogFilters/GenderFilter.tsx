import React from 'react';

interface GenderFilterProps {
  selectedGender: string;
  onSelectGender: (gender: string) => void;
}

export const GenderFilter: React.FC<GenderFilterProps> = ({
  selectedGender,
  onSelectGender,
}) => {
  const genders = ['all', 'Mujer', 'Hombre', 'Unisex'];

  return (
    <div className="filter-group">
      <h4 className="filter-title">Género</h4>
      <ul className="filter-list">
        {genders.map((gen) => (
          <li key={gen}>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                checked={selectedGender === gen}
                onChange={() => onSelectGender(gen)}
              />
              <span className="radio-text">
                {gen === 'all' ? 'Todos los géneros' : gen}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
