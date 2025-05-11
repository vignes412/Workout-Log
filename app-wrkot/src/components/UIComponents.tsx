import React from 'react';

// Card component that follows the style guidelines
type CardProps = {
  title: string;
  children: React.ReactNode;
  imageUrl?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ title, children, imageUrl, ...props }: CardProps) => {
  return (
    <div className="card" {...props}>
      {imageUrl && (
        <div className="exercise-image mb-md">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-t-card" />
        </div>
      )}
      <h3 className="text-section-header font-header mb-md">{title}</h3>
      <div className="text-body">{children}</div>
    </div>
  );
};

// Button component that follows the style guidelines
type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outlined';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, variant = 'primary', ...props }: ButtonProps) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    outlined: "bg-transparent border border-primary text-primary"
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};

// Input component that follows the style guidelines
type InputProps = {
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ label, id, ...props }: InputProps) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="mb-md">
      {label && (
        <label htmlFor={inputId} className="block text-caption mb-sm font-emphasis">
          {label}
        </label>
      )}
      <input id={inputId} className="form-input" {...props} />
    </div>
  );
};

// Exercise card component specifically for the exercise list
type ExerciseCardProps = {
  name: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
};

export const ExerciseCard = ({ name, description, imageUrl, onClick }: ExerciseCardProps) => {
  return (
    <div className="exercise-card card" onClick={onClick}>
      <div className="exercise-image mb-md">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-t-card" />
      </div>
      <h3 className="text-section-header font-header mb-sm">{name}</h3>
      <p className="text-body mb-md">{description}</p>
      <Button>Add to Workout</Button>
    </div>
  );
};

// Login form component for the login page
export const LoginForm = () => {
  return (
    <div className="login-page">
      <div className="login-card card">
        <h1 className="text-page-title font-header mb-xl text-center">Workout Log</h1>
        <form>
          <Input label="Email" type="email" placeholder="Enter your email" />
          <Input label="Password" type="password" placeholder="Enter your password" />
          <Button className="w-full">Sign In</Button>
          <p className="text-caption text-center mt-md">
            Don't have an account? <a href="#" className="text-primary">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
};

// Dashboard layout component
type DashboardLayoutProps = {
  children: React.ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="dashboard">
      <header className="header bg-primary text-white flex items-center px-lg">
        <h1 className="text-section-header">Workout Log</h1>
      </header>
      <aside className="sidebar bg-card p-md">
        {/* Sidebar navigation would go here */}
        <nav>
          <ul>
            <li className="mb-md"><a href="#" className="text-body font-emphasis">Dashboard</a></li>
            <li className="mb-md"><a href="#" className="text-body font-emphasis">Workouts</a></li>
            <li className="mb-md"><a href="#" className="text-body font-emphasis">Exercises</a></li>
            <li className="mb-md"><a href="#" className="text-body font-emphasis">Progress</a></li>
            <li className="mb-md"><a href="#" className="text-body font-emphasis">Settings</a></li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Example usage of the grid layout for exercise list
export const ExerciseGrid = ({ exercises }: { exercises: ExerciseCardProps[] }) => {
  return (
    <div className="grid-layout">
      {exercises.map((exercise, index) => (
        <ExerciseCard key={index} {...exercise} />
      ))}
    </div>
  );
};

// Workout exercise row component
type ExerciseRowProps = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export const ExerciseRow = ({ name, sets, reps, weight }: ExerciseRowProps) => {
  return (
    <div className="exercise-row flex items-center justify-between">
      <div>
        <h3 className="font-emphasis">{name}</h3>
        <p className="text-caption">{sets} sets × {reps} reps</p>
      </div>
      <div className="set-counter">
        <span className="text-body font-header">{weight} kg</span>
      </div>
    </div>
  );
};
