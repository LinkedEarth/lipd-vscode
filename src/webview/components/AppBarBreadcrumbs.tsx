import React from 'react';
import { Breadcrumbs, Typography, IconButton, Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { NavigateNext, Home } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from '../router';

const AppBarBreadcrumbs: React.FC = () => {
  const { breadcrumbs, navigateTo, goBack, canGoBack } = useRouter();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
      <Tooltip title="Go back">
        <span>
          <IconButton 
            size="small" 
            onClick={goBack} 
            disabled={!canGoBack}
            sx={{ mr: 1 }}
            aria-label="Back"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
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
    </Box>
  );
};

export default AppBarBreadcrumbs; 