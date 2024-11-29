"use client";

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  link?: string;
  action?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, link, action }) => {
  const handleClick = () => {
    if (action) {
      action();
    } else if (link) {
      window.location.href = link;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-lg shadow-md p-6 
        transition-all duration-200 
        ${(link || action) ? 'cursor-pointer hover:shadow-lg hover:translate-y-[-2px]' : ''}
      `}
    >
      <div className="flex items-center mb-4">
        {icon && (
          <div className="mr-3 text-indigo-600">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default ActionCard;
