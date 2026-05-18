import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'vant/lib/index.css'
import {
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  Toast,
  Dialog,
  NavBar,
  Tabbar,
  TabbarItem,
  Tab,
  Tabs,
  Empty,
  List,
  PullRefresh,
  ActionSheet,
  Popup,
  Picker,
  RadioGroup,
  Radio,
  Uploader,
  ImagePreview,
  Divider,
  Tag,
  Icon,
  Progress,
  Calendar,
  NumberKeyboard,
  SwipeCell,
  Sidebar,
  SidebarItem,
  Collapse,
  CollapseItem,
  Grid,
  GridItem,
  Image as VanImage,
  DatePicker,
  showToast,
  showConfirmDialog
} from 'vant'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.use(Button)
app.use(Cell)
app.use(CellGroup)
app.use(Field)
app.use(Form)
app.use(Toast)
app.use(Dialog)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Tab)
app.use(Tabs)
app.use(Empty)
app.use(List)
app.use(PullRefresh)
app.use(ActionSheet)
app.use(Popup)
app.use(DatePicker)
app.use(Picker)
app.use(RadioGroup)
app.use(Radio)
app.use(Uploader)
app.use(ImagePreview)
app.use(Divider)
app.use(Tag)
app.use(Icon)
app.use(Progress)
app.use(Calendar)
app.use(NumberKeyboard)
app.use(SwipeCell)
app.use(Sidebar)
app.use(SidebarItem)
app.use(Collapse)
app.use(CollapseItem)
app.use(Grid)
app.use(GridItem)
app.use(VanImage)

app.mount('#app')
