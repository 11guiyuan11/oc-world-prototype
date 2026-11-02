import { createHashRouter } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import WorldOnboarding from './pages/WorldOnboarding'
import WorldHome from './pages/WorldHome'
import Characters from './pages/Characters'
import CharacterDetail from './pages/CharacterDetail'
import Relations from './pages/Relations'
import Timeline from './pages/Timeline'
import Codex from './pages/Codex'
import Consistency from './pages/Consistency'
import ShareCard from './pages/ShareCard'
import ExportArtist from './pages/ExportArtist'
import Data from './pages/Data'
import Share from './pages/Share'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'onboarding/world', element: <WorldOnboarding /> },
      { path: 'world/:id', element: <WorldHome /> },
      { path: 'characters', element: <Characters /> },
      { path: 'characters/:id', element: <CharacterDetail /> },
      { path: 'relations', element: <Relations /> },
      { path: 'timeline', element: <Timeline /> },
      { path: 'codex', element: <Codex /> },
      { path: 'consistency', element: <Consistency /> },
      { path: 'share-card', element: <ShareCard /> },
      { path: 'export-artist', element: <ExportArtist /> },
      { path: 'data', element: <Data /> },
    ],
  },
  { path: '/share/:token', element: <Share /> },
])
