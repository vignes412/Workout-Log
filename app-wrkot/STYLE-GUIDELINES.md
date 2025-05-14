# Style Guidelines Documentation

This document provides an overview of the style system implementation and how to use it in your Workout Log application.

## Table of Contents

1. [Typography](#typography)
2. [Spacing & Dimensions](#spacing--dimensions)
3. [Component Styling](#component-styling)
4. [Page Layouts](#page-layouts)
5. [Responsive Design](#responsive-design)
6. [Usage Examples](#usage-examples)

## Typography

The application uses Roboto as the primary font with Helvetica and Arial as fallbacks.

### Font Sizes

- Page Title: 34px - Use for main page headers
- Section Header: 24px - Use for section titles
- Body: 16px - Default text size
- Buttons: 15px - Text size for buttons
- Captions: 14px - Use for supporting text and labels

### Font Weights

- Regular (400): Default text
- Emphasis (500): Used for emphasizing content
- Headers (600): Used for all headings

### Line Heights

- Headers: 1.2
- Body: 1.5
- Buttons: 1.75

### Usage in React Components

```tsx
// Using font sizes with Tailwind classes
<h1 className="text-page-title font-header leading-header">Workout Log</h1>
<h2 className="text-section-header font-header leading-header">Recent Workouts</h2>
<p className="text-body font-regular leading-body">This is regular text.</p>
<button className="text-button font-emphasis leading-button">Click Me</button>
<span className="text-caption">Last updated: Yesterday</span>
```

## Spacing & Dimensions

### Containers

- Max Width: 1200px
- Card Max Width: 400px
- Card Min Width: 280px

### Breakpoints

- Mobile: <600px
- Tablet: 600-960px
- Desktop: >960px

### Spacing System

- xs: 4px - Tiny spacing (icon padding, tight elements)
- sm: 8px - Small spacing (button padding, small gaps)
- md: 16px - Medium spacing (card padding, standard margins)
- lg: 24px - Large spacing (section padding)
- xl: 32px - Extra large spacing (section margins)
- xxl: 48px - Extra extra large spacing (large vertical gaps)

### Usage Examples

```tsx
// Container with max width
<div className="container">Content goes here</div>

// Card with proper dimensions
<div className="card">Card content</div>

// Using spacing
<div className="p-md mb-lg">
  This element has medium padding and large bottom margin
</div>

// Grid layouts
<div className="grid-layout">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Component Styling

### Cards

- Border Radius: 12px
- Shadow: 0 4px 12px rgba(0,0,0,0.05)
- Padding: 16px

### Buttons

- Border Radius: 4px
- Height: 36px
- Padding: 8px 16px

### Inputs

- Height: 56px
- Border Radius: 4px

### Progress Indicators

- Circular: 40px diameter, 4px thick
- Linear: 4px high

### Usage Examples

```tsx
// Card component
<div className="card">
  <h3 className="text-section-header">Card Title</h3>
  <p>Content goes here</p>
</div>

// Button component
<button className="btn">Click Me</button>

// Input component
<input type="text" className="form-input" placeholder="Enter value" />

// Progress indicators
<div className="progress-circular"></div>
<div className="progress-linear"></div>
```

## Page Layouts

### Login Page

```tsx
<div className="login-page">
  <div className="login-card card">
    <h1 className="text-section-header">Login</h1>
    <form>
      <input type="email" className="form-input" placeholder="Email" />
      <input type="password" className="form-input" placeholder="Password" />
      <button className="btn">Sign In</button>
    </form>
  </div>
</div>
```

### Dashboard

```tsx
<div className="dashboard">
  <header className="header">
    <!-- Header content -->
  </header>
  <aside className="sidebar">
    <!-- Sidebar content -->
  </aside>
  <main className="main-content">
    <div className="grid-layout">
      <!-- Dashboard cards go here -->
    </div>
  </main>
</div>
```

### Exercise List

```tsx
<div className="grid-layout">
  <div className="exercise-card card">
    <div className="exercise-image">
      <!-- Image goes here -->
    </div>
    <h3 className="text-section-header">Exercise Name</h3>
    <p className="text-body">Exercise description</p>
  </div>
  <!-- More exercise cards -->
</div>
```

### Workout

```tsx
<div>
  <div className="exercise-row">
    <h3>Bench Press</h3>
    <div className="set-counter">
      <!-- Set counter content -->
    </div>
  </div>
  <!-- More exercise rows -->
</div>
```

## Responsive Design

The application uses responsive design principles with these key behaviors:

### Mobile (<600px)

- Stacked cards (single column)
- Collapsed sidebar (64px)
- 0.875x font size

### Tablet (600-960px)

- 2-column grid
- 16px padding

### Desktop (>960px)

- 3-4 column grid
- Full sidebar

The responsive behavior is automatically applied through the CSS classes and Tailwind configuration.

## Usage Examples

### Complete Example Component

```tsx
import React from 'react';

const WorkoutCard = ({ title, date, exercises }) => {
  return (
    <div className="card">
      <h3 className="text-section-header font-header mb-sm">{title}</h3>
      <p className="text-caption mb-md">{date}</p>
      
      <div className="mb-md">
        {exercises.map((exercise, index) => (
          <div key={index} className="mb-sm">
            <p className="font-emphasis">{exercise.name}</p>
            <p className="text-caption">{exercise.sets} sets × {exercise.reps} reps</p>
          </div>
        ))}
      </div>
      
      <button className="btn">View Details</button>
    </div>
  );
};

export default WorkoutCard;
```
