import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface DownloadedVideo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  date: string;
}

const Index = () => {
  const [urlInput, setUrlInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<DownloadedVideo[]>([
    {
      id: '1',
      url: 'https://example.com/video1.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113',
      title: 'Рецепт пасты карбонара',
      date: '2 часа назад'
    },
    {
      id: '2',
      url: 'https://example.com/video2.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      title: 'DIY декор комнаты',
      date: 'Вчера'
    },
    {
      id: '3',
      url: 'https://example.com/video3.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
      title: 'Тренировка для начинающих',
      date: '3 дня назад'
    }
  ]);

  const handleDownload = () => {
    if (!urlInput.trim()) {
      toast.error('Введите ссылку на видео');
      return;
    }

    if (!urlInput.includes('pinterest')) {
      toast.error('Это не ссылка на Pinterest');
      return;
    }

    setIsDownloading(true);

    setTimeout(() => {
      const newVideo: DownloadedVideo = {
        id: Date.now().toString(),
        url: urlInput,
        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0',
        title: 'Новое видео из Pinterest',
        date: 'Только что'
      };

      setHistory([newVideo, ...history]);
      setUrlInput('');
      setIsDownloading(false);
      toast.success('Видео успешно скачано!');
    }, 2000);
  };

  const handleQuickDownload = (video: DownloadedVideo) => {
    toast.success('Видео загружено повторно!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-6 shadow-lg hover-scale">
            <Icon name="Download" size={40} className="text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Pinterest Video Bot
          </h1>
          <p className="text-muted-foreground text-lg">
            Скачивайте видео из Pinterest быстро и просто
          </p>
        </div>

        <Card className="mb-12 shadow-xl border-0 animate-scale-in">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Вставьте ссылку на видео Pinterest..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="h-14 text-lg border-2 focus:border-primary transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                />
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-14 px-8 text-lg font-semibold hover-scale"
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                    Скачиваю...
                  </>
                ) : (
                  <>
                    <Icon name="Download" className="mr-2" size={20} />
                    Скачать
                  </>
                )}
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Icon name="Info" size={16} />
              <span>Поддерживаются ссылки вида: pinterest.com/pin/...</span>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="History" size={24} className="text-primary" />
            <h2 className="text-3xl font-bold">История скачиваний</h2>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {history.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Icon name="Trash2" size={18} className="mr-2" />
            Очистить
          </Button>
        </div>

        {history.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icon name="Video" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg">
              Здесь будет история ваших скачиваний
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((video, index) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover-scale group cursor-pointer border-0 shadow-lg"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fade-in 0.5s ease-out forwards'
                }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="shadow-2xl"
                      onClick={() => handleQuickDownload(video)}
                    >
                      <Icon name="Download" size={20} className="mr-2" />
                      Скачать снова
                    </Button>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground shadow-lg">
                    <Icon name="Video" size={14} className="mr-1" />
                    Video
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icon name="Clock" size={14} className="mr-2" />
                    {video.date}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Card className="inline-block p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="Shield" size={24} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg mb-1">Админ-панель</h3>
                <p className="text-sm text-muted-foreground">
                  Управление ботом и статистика скачиваний
                </p>
              </div>
              <Button variant="outline" className="ml-4" onClick={() => window.location.href = '/admin'}>
                <Icon name="Settings" size={18} className="mr-2" />
                Открыть
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;