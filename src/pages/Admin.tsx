import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const ADMIN_API_URL = 'https://functions.poehali.dev/d102decf-2c57-4108-9205-4e547966c196';

interface Stats {
  total_downloads: number;
  unique_users: number;
  total_size: number;
  daily_stats: Array<{ date: string; count: number }>;
  top_videos: Array<{ title: string; count: number }>;
}

interface Download {
  id: number;
  title: string;
  thumbnail_url: string;
  downloaded_at: string;
  username: string;
  first_name: string;
  pinterest_url: string;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [inputAdminId, setInputAdminId] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('7');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedAdminId = localStorage.getItem('adminId');
    if (savedAdminId) {
      setAdminId(savedAdminId);
      setIsAuthenticated(true);
      loadData(savedAdminId);
    }
  }, []);

  const handleLogin = () => {
    if (!inputAdminId.trim()) {
      toast.error('Введите Telegram ID');
      return;
    }
    
    localStorage.setItem('adminId', inputAdminId);
    setAdminId(inputAdminId);
    setIsAuthenticated(true);
    loadData(inputAdminId);
    toast.success('Вход выполнен!');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    setAdminId('');
    setIsAuthenticated(false);
    setStats(null);
    setDownloads([]);
  };

  const loadData = async (id: string) => {
    setIsLoading(true);
    try {
      const statsResponse = await fetch(`${ADMIN_API_URL}?endpoint=stats&period=${period}`, {
        headers: { 'X-Admin-Id': id }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        toast.error('Ошибка доступа. Проверьте Telegram ID');
        handleLogout();
      }

      const downloadsResponse = await fetch(`${ADMIN_API_URL}?endpoint=downloads&limit=50`, {
        headers: { 'X-Admin-Id': id }
      });
      
      if (downloadsResponse.ok) {
        const downloadsData = await downloadsResponse.json();
        setDownloads(downloadsData.downloads || []);
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const searchDownloads = async () => {
    if (!adminId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${ADMIN_API_URL}?endpoint=downloads&search=${encodeURIComponent(searchQuery)}&limit=50`,
        { headers: { 'X-Admin-Id': adminId } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDownloads(data.downloads || []);
      }
    } catch (error) {
      toast.error('Ошибка поиска');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
              <Icon name="Shield" size={40} className="text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Админ-панель</CardTitle>
            <p className="text-muted-foreground mt-2">
              Введите ваш Telegram ID для входа
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Telegram ID (из @userinfobot)"
                value={inputAdminId}
                onChange={(e) => setInputAdminId(e.target.value)}
                className="h-12 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full h-12 text-lg" size="lg">
              <Icon name="LogIn" className="mr-2" size={20} />
              Войти
            </Button>
            <div className="text-sm text-muted-foreground text-center pt-2">
              <p>Узнать ID: откройте <a href="https://t.me/userinfobot" target="_blank" className="text-primary underline">@userinfobot</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Icon name="Shield" size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Админ-панель</h1>
              <p className="text-muted-foreground">ID: {adminId}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="stats">
              <Icon name="BarChart3" size={18} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Icon name="Download" size={18} className="mr-2" />
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div className="flex gap-2 mb-6">
              {['7', '30', '90'].map((days) => (
                <Button
                  key={days}
                  variant={period === days ? 'default' : 'outline'}
                  onClick={() => {
                    setPeriod(days);
                    loadData(adminId);
                  }}
                  size="sm"
                >
                  {days} дней
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin mx-auto text-primary" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Всего скачиваний
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">
                        {stats.total_downloads}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Уникальных пользователей
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">
                        {stats.unique_users}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Объем данных
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">
                        {formatBytes(stats.total_size)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Топ-10 видео</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.top_videos.length > 0 ? (
                        stats.top_videos.map((video, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{video.title}</span>
                            </div>
                            <Badge>{video.count} скачиваний</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">Нет данных</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="downloads" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Поиск по названию или ссылке..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchDownloads()}
                    className="h-12"
                  />
                  <Button onClick={searchDownloads} size="lg" className="px-8">
                    <Icon name="Search" size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="text-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {downloads.length > 0 ? (
                  downloads.map((download) => (
                    <Card key={download.id} className="overflow-hidden hover:shadow-2xl transition-all hover-scale border-0 shadow-lg">
                      <div className="relative">
                        <img
                          src={download.thumbnail_url || 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0'}
                          alt={download.title}
                          className="w-full h-48 object-cover"
                        />
                        <Badge className="absolute top-3 right-3 bg-primary">
                          <Icon name="Video" size={14} className="mr-1" />
                          Video
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold mb-2 line-clamp-1">{download.title || 'Без названия'}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Icon name="User" size={14} />
                            <span>{download.first_name || download.username || 'Анонимный'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={14} />
                            <span>{formatDate(download.downloaded_at)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => window.open(download.pinterest_url, '_blank')}
                        >
                          <Icon name="ExternalLink" size={14} className="mr-2" />
                          Открыть в Pinterest
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Icon name="FileSearch" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Скачиваний пока нет</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
