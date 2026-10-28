# Matriz de rotación de capas

**Grupo:** LiftSafe
**Ficha:** _(número de ficha)_
**Stack:** React + FastAPI + MySQL

## Capas por semana

Cada semana cada integrante trabaja una capa distinta. El revisor de un PR debe tener una capa distinta a la del autor.

> **S2:** son 5 integrantes y 4 capas, así que API la comparten Valentina y Esteban, y Front la comparten Dayan y Luz, sobre unidades distintas. Felipe repite E2E porque la capa E2E monta el CI (pendiente de confirmar con el instructor). La capa **BD** queda para la semana 3.

| Integrante (usuario GitHub) | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
|---|---|---|---|---|---|---|---|---|---|
| @MendVal (Valentina) | E2E | API | | | | | | | |
| @esteban64-64 (Esteban) | E2E | API | | | | | | | |
| @Felipemesa1 (Felipe) | E2E | E2E (CI) | | | | | | | |
| @usuario-dayan (Dayan) | E2E | Front | | | | | | | |
| @usuario-luz (Luz) | E2E | Front | | | | | | | |

## Cobertura semanal

Cifra real medida al cierre de cada semana (líneas) y umbral que se exige la semana siguiente: el mayor entre 30 y la cifra, redondeada hacia abajo.

| Semana | Frontend (Vitest, % líneas) | Backend (pytest, % total) | Umbral semana siguiente |
|---|---|---|---|
| S1 | 1.22 | 45.64 | Front 30 · Back 45 |
| S2 | 33.33 | 48.10 | Front 33 · Back 48 |

## Integración continua (desde la semana 2)

- Workflow: `.github/workflows/tests.yml`, con los jobs `frontend` y `backend-fastapi`, más un resumen de commits de test por autor.
- Regla de rama: el repositorio es **público**, así que se activa un ruleset en `main` (*Require a pull request* + *Require status checks*: `frontend` y `backend-fastapi`). Si no se pudiera activar, la regla manual es que **nadie fusiona un PR en rojo**.
- Prueba del rojo: con `fail_under = 99` o `lines: 99`, el job correspondiente queda en ❌; al devolver el valor, vuelve a ✅.
- Exclusiones de cobertura: solo `src/main.jsx` (arranque de React), `src/assets/**` (imágenes), `src/data/**` (datos de demostración) y `app/__init__.py` en el backend. Ninguna tiene lógica de negocio.


All files                      |   35.66 |    24.61 |   39.05 |   35.54 |                                              
 src                           |       0 |        0 |       0 |       0 |                                              
  App.jsx                      |       0 |        0 |       0 |       0 | 26-75                                        
 src/components                |   83.85 |    59.44 |   78.12 |   85.71 |                                              
  ChecklistInspeccion.jsx      |      98 |    90.74 |     100 |     100 | 44,95,120,125,253                            
  ConfirmDialog.jsx            |       0 |        0 |       0 |       0 | 24                                           
  ListPagination.jsx           |     100 |    85.71 |     100 |     100 | 8                                            
  Logo.jsx                     |     100 |      100 |     100 |     100 |                                              
  MessageDialog.jsx            |     100 |      100 |     100 |     100 |                                              
  PageHeader.jsx               |       0 |        0 |       0 |       0 | 5-10                                         
  PasswordRequirements.jsx     |     100 |      100 |     100 |     100 |                                              
  PromptDialog.jsx             |     100 |      100 |     100 |     100 |                                              
  RoleRoute.jsx                |     100 |      100 |     100 |     100 |                                              
  SearchBar.jsx                |       0 |        0 |       0 |       0 | 5-10                                         
  SedesClienteDialog.jsx       |   83.87 |    64.28 |   72.72 |      85 | 31,38,54,73,83,111-117,153                   
  StatCard.jsx                 |       0 |        0 |       0 |       0 | 10-18                                        
  WelcomeBanner.jsx            |     100 |      100 |     100 |     100 |                                              
 src/components/dashboard      |       0 |        0 |       0 |       0 |                                              
  ActivityPanel.jsx            |       0 |        0 |       0 |       0 | 8-38                                         
  ChartCard.jsx                |       0 |        0 |       0 |       0 | 4                                            
  DashboardCharts.jsx          |       0 |        0 |       0 |       0 | 9-147                                        
  StatusPieChart.jsx           |       0 |        0 |       0 |       0 | 4-34                                         
 src/config                    |     100 |    91.66 |     100 |     100 |                                              
  api.js                       |     100 |     87.5 |     100 |     100 | 151                                          
  roles.js                     |     100 |      100 |     100 |     100 |                                              
 src/constants                 |       0 |      100 |     100 |       0 |                                              
  demoUsers.js                 |       0 |      100 |     100 |       0 | 1                                            
 src/context                   |   98.24 |    76.92 |   88.88 |   98.18 |                                              
  AuthContext.jsx              |   98.24 |    76.92 |   88.88 |   98.18 | 17                                           
 src/hooks                     |     100 |    86.66 |     100 |     100 |                                              
  useDashboardData.js          |     100 |    85.71 |     100 |     100 | 22,44,69                                     
  usePaginatedSearch.js        |     100 |    88.88 |     100 |     100 | 15                                           
 src/layouts                   |   67.46 |    82.19 |   65.85 |   70.09 |                                              
  AuthLayout.jsx               |     100 |      100 |     100 |     100 |                                              
  DashboardLayout.jsx          |    67.2 |    80.88 |      65 |   69.81 | 51-66,77,164-171,186,200,222,280,294,355-385 
 src/pages                     |   10.19 |     7.67 |     6.9 |   10.66 |                                              
  Auditoria.jsx                |       0 |        0 |       0 |       0 | 9-103                                        
  Buildings.jsx                |       0 |        0 |       0 |       0 | 23-222                                       
  DashboardHome.jsx            |       0 |        0 |       0 |       0 | 10-34                                        
  Elevators.jsx                |       0 |        0 |       0 |       0 | 30-421                                       
  Encuestas.jsx                |       0 |        0 |       0 |       0 | 17-176                                       
  ForgotPassword.jsx           |     100 |       90 |     100 |     100 | 88,107-120,169                               
  Inspections.jsx              |       0 |        0 |       0 |       0 | 38-1484                                      
  Landing.jsx                  |       0 |      100 |       0 |       0 | 10-60                                        
  Login.jsx                    |     100 |    93.75 |     100 |     100 | 152                                          
  Register.jsx                 |     100 |      100 |     100 |     100 |                                              
  Reports.jsx                  |       0 |        0 |       0 |       0 | 34-459                                       
  ResetPassword.jsx            |   96.87 |       90 |      80 |     100 | 56,94                                        
  Settings.jsx                 |       0 |        0 |       0 |       0 | 8-45                                         
  Solicitudes.jsx              |       0 |        0 |       0 |       0 | 51-828                                       
  Users.jsx                    |       0 |        0 |       0 |       0 | 30-414                                       
 src/pages/dashboards          |       0 |        0 |       0 |       0 |                                              
  AdminDashboard.jsx           |       0 |        0 |       0 |       0 | 26-375                                       
  AsesorDashboard.jsx          |       0 |        0 |       0 |       0 | 16-50                                        
  ClientDashboard.jsx          |       0 |        0 |       0 |       0 | 17-52                                        
  CoordinadorDashboard.jsx     |       0 |        0 |       0 |       0 | 24-321                                       
  DirectorTecnicoDashboard.jsx |       0 |        0 |       0 |       0 | 19-79                                        
  InspectorDashboard.jsx       |       0 |        0 |       0 |       0 | 17-44                                        
 src/services                  |   89.93 |    76.92 |   88.28 |   90.83 |                                              
  apiClient.js                 |   97.05 |    95.23 |    87.5 |     100 | 29                                           
  ascensorService.js           |   81.25 |       50 |    87.5 |   86.66 | 17-18                                        
  auditoriaService.js          |     100 |      100 |     100 |     100 |                                              
  authService.js               |   93.93 |    62.79 |   91.66 |   93.54 | 12,118                                       
  checklistService.js          |     100 |      100 |     100 |     100 |                                              
  clienteService.js            |     100 |      100 |     100 |     100 |                                              
  dashboardService.js          |     100 |    96.22 |     100 |     100 | 149,170                                      
  encuestaService.js           |     100 |      100 |     100 |     100 |                                              
  firmaService.js              |     100 |      100 |     100 |     100 |                                              
  fotografiaService.js         |      50 |    28.57 |      60 |   53.33 | 15-22                                        
  informeService.js            |     100 |      100 |     100 |     100 |                                              
  inspeccionesService.js       |     100 |      100 |     100 |     100 |                                              
  notificacionService.js       |   70.58 |       50 |    62.5 |      75 | 11-12,18,38                                  
  observacionService.js        |     100 |      100 |     100 |     100 |                                              
  programacionService.js       |     100 |      100 |     100 |     100 |                                              
  solicitudService.js          |   76.92 |       70 |   57.14 |      76 | 15,33,55,65,68,73                            
  usuarioAscensorService.js    |     100 |      100 |     100 |     100 |                                              
  usuarioService.js            |   76.92 |     62.5 |      80 |   83.33 | 11-12                                        
 src/theme                     |   66.66 |      100 |     100 |   66.66 |                                              
  colors.js                    |     100 |      100 |     100 |     100 |                                              
  theme.js                     |       0 |      100 |     100 |       0 | 4                                            
 src/utils                     |   93.06 |    93.75 |     100 |   93.67 |                                              
  checklist.js                 |     100 |    83.33 |     100 |     100 | 3                                            
  encoding.js                  |    90.9 |    94.44 |     100 |   93.33 | 15                                           
  filtroEstado.js              |     100 |      100 |     100 |     100 |                                              
  passwordValidation.js        |     100 |      100 |     100 |     100 |                                              
  statusHelpers.js             |       0 |      100 |     100 |       0 | 2-41                                         
  sucursales.js                |   93.33 |    84.61 |     100 |     100 | 13-20                                        
  tokenStorage.js              |     100 |      100 |     100 |     100 |        