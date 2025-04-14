import React from 'react';
import { Breadcrumbs, Typography } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { useRouter } from '../router';

const AppBarBreadcrumbs: React.FC = () => {
  const { breadcrumbs, navigateTo } = useRouter();

  return (
    <Breadcrumbs
      separator={<NavigateNext fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ flexGrow: 1 }}
    >
      {breadcrumbs.map((crumb, index) => (
        <Typography
          key={crumb.path}
          variant="body1"
          color={index === breadcrumbs.length - 1 ? 'text.primary' : 'primary'}
          onClick={() => navigateTo(crumb.path)}
          sx={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal'
          }}
        >
          {index === 0 && <Home sx={{ mr: 0.5 }} fontSize="small" />}
          {crumb.label}
        </Typography>
      ))}
    </Breadcrumbs>
  );
};

export default AppBarBreadcrumbs; 