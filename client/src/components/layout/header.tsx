import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <i className="fas fa-users text-blue-600 text-2xl" />
            <h1 className="text-xl font-bold text-gray-900">在席管理システム</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative max-w-md hidden md:block">
              <Input
                type="text"
                placeholder="社員名で検索..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64"
                alt="プロフィール画像"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium hidden md:inline">田中 太郎</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
