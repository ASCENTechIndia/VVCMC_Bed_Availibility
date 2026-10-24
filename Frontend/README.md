# VVCMC Hospital Bed Dashboard (React)

React (Vite + React Router) conversion of the original HTML files.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
```

## Routes
| URL | Original file |
|---|---|
| `/` | Bed-Availability/Bed_Availability.html |
| `/admin/login` | login.html |
| `/admin/logout` | logout.html |
| `/admin/dashboard` | dashboard.html |
| `/admin/select-hospital` | select-hospital.html |
| `/admin/bed-update?hospital_id=1` | bed-update.html |
| `/admin/bed-capacity?hospital_id=1` | bed-capacity.html |
| `/admin/hospitals` | hospital-list.html |
| `/admin/hospitals/add` | hospital-add.html |
| `/admin/hospitals/edit?id=1` | hospital-edit.html |
| `/admin/update-history` | update-history.html |

## Notes
- The two original stylesheets (`style.css`, `admin.css`) share class names, so each layout loads only its own CSS (`src/hooks/useStyles.js`).
- Data lives in `src/context/DataContext.jsx` (seed in `src/data/seed.js`) and is persisted to `localStorage`. Replace the context actions with API calls for a real backend.
- Login is a demo: any non-empty username/password works (`Login.jsx`).
