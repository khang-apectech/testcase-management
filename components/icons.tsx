import {
  Home,
  Users,
  Settings,
  BarChart2,
  ClipboardList,
  MoreVertical,
  Plus,
  ArrowLeft,
  Edit,
  Trash,
  Loader2,
  LogOut,
  type Icon as LucideIcon,
} from "lucide-react"

export type Icon = typeof LucideIcon

export const Icons = {
  home: Home,
  users: Users,
  settings: Settings,
  stats: BarChart2,
  testCase: ClipboardList,
  more: MoreVertical,
  add: Plus,
  back: ArrowLeft,
  edit: Edit,
  delete: Trash,
  spinner: Loader2,
  logout: LogOut,
} 