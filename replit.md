# Overview

SkillMesh Demo is a React-based application that visualizes organizational skills and capabilities through interactive network graphs. The application uses Cytoscape.js to create dynamic visualizations of people, their skills, certifications, and various organizational metrics. It's designed as a skills management and visualization platform that helps organizations understand their talent landscape and capability distribution.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 19 with TypeScript for type safety and modern component patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: CSS modules with custom CSS variables for theming, featuring a dark theme design system
- **Visualization Engine**: Cytoscape.js with React wrapper (react-cytoscapejs) for creating interactive network graphs
- **Component Structure**: Single-page application with modular CSS and TypeScript configuration

## Development Environment
- **TypeScript Configuration**: Strict typing with separate configs for app and build tools
- **Code Quality**: ESLint with React-specific rules and hooks validation
- **Module System**: ES modules with bundler resolution for modern JavaScript features
- **Development Server**: Vite dev server configured to run on all interfaces (0.0.0.0) on port 5000

## Data Management
- **State Management**: React hooks for local component state management
- **Data Structure**: In-memory data modeling for people, skills, certifications, and organizational metrics
- **Skill Mapping**: Weighted importance system with five-tier classification (Critical, High, Medium, Low, Optional)
- **Availability Tracking**: Time-based resource allocation with hours and percentage availability

## Visualization Strategy
- **Graph Rendering**: Cytoscape.js for creating interactive node-edge networks
- **Layout Algorithms**: Support for various graph layout algorithms for optimal visualization
- **Interactive Elements**: Real-time graph manipulation and filtering capabilities
- **Responsive Design**: Adaptive UI that works across different screen sizes

# External Dependencies

## Core Libraries
- **React 19**: Latest React version for component rendering and state management
- **TypeScript**: Static typing for enhanced development experience and code reliability
- **Cytoscape.js**: Graph theory library for network visualization and analysis
- **react-cytoscapejs**: React wrapper for Cytoscape.js integration

## Development Tools
- **Vite**: Modern build tool for fast development and optimized production builds
- **ESLint**: Code linting with React and TypeScript support
- **TypeScript ESLint**: Enhanced linting rules for TypeScript codebases

## Build and Development
- **@vitejs/plugin-react**: Vite plugin for React support with fast refresh
- **Various ESLint plugins**: React hooks validation and React refresh support
- **TypeScript compiler**: Latest TypeScript version for type checking and compilation

The application currently operates as a standalone frontend application without external API dependencies or database connections, making it suitable for demonstration and prototyping purposes.