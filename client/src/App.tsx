import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { PlayerSyncBridge } from '@/components/player/PlayerSyncBridge';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Search from '@/pages/Search';
import Settings from '@/pages/Settings';
import AlbumDetail from '@/pages/AlbumDetail';
import ArtistDetail from '@/pages/ArtistDetail';
import PlaylistDetail from '@/pages/PlaylistDetail';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/library" component={Library} />
        <Route path="/search" component={Search} />
        <Route path="/settings" component={Settings} />
        <Route path="/album/:id" component={AlbumDetail} />
        <Route path="/artist/:id" component={ArtistDetail} />
        <Route path="/playlist/:id" component={PlaylistDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LibraryProvider>
          <PlayerProvider>
            <PlayerSyncBridge />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
          </PlayerProvider>
        </LibraryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
