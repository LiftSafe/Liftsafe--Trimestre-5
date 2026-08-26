import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.resolve(
  root,
  '../.cursor/projects/empty-window/assets/c__Users_mendi_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_logo-2cf7c112-e143-47c0-b146-2648a580955e.png'
);
const dest = path.join(root, 'src/assets/logo.png');
const publicDest = path.join(root, 'public/logo.png');

if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
  fs.copyFileSync(src, dest);
  fs.copyFileSync(src, publicDest);
  console.log('Logo copiado correctamente');
} else {
  console.warn('Logo fuente no encontrado, usando ruta alternativa');
}
