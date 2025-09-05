'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '280px',
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />
      <Box
        sx={{
          bgcolor: '#FFF8E1',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100%',
        }}
      >
        {/* SideNav solo visible en escritorio */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
        </Box>

        {/* Botón hamburguesa solo en móvil */}
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            display: { xs: 'inline-flex', md: 'none' },
            bgcolor: '#fff',
            boxShadow: 1,
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Drawer móvil */}
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* ...resto del layout... */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            pl: { lg: collapsed ? '72px' : 'var(--SideNav-width)' },
            transition: 'padding-left 0.2s',
          }}
        >
          <MainNav />
          <main>
            <Container maxWidth={false} sx={{ py: '32px', px: { xs: 1, md: 3 } }}>
              {children}
            </Container>
          </main>
        </Box>
      </Box>
    </AuthGuard>
  );
}
