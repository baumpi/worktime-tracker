# Worktime Tracker 🕐

Simple, self-hosted worktime tracking app. Track your working hours with a goal of working **less**, not more.

![Screenshot](https://via.placeholder.com/800x400?text=Worktime+Tracker)

## Features

- ⏱️ **Quick Entry** - Log time as from/to or direct hours
- 🎯 **Weekly Target** - Set your goal (default: 35h/week)
- 📊 **8-Week Trend** - Visual chart of your work patterns
- 📅 **Reports** - Weekly and monthly summaries
- 📄 **PDF Export** - Professional monthly reports
- 💾 **Data Export** - JSON and CSV backup
- 🏷️ **Categories** - Organize by project/client
- ⚡ **Presets** - One-click "8-15 Uhr" or "like yesterday"
- 🍕 **Auto-Pause** - Automatic break deduction for >6h days

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/YOUR_USERNAME/worktime-tracker.git
cd worktime-tracker
docker-compose up -d
```

Open http://localhost:3000

### Option 2: Docker Run

```bash
docker build -t worktime-tracker .
docker run -d \
  --name worktime-tracker \
  -p 3000:3000 \
  -v worktime-data:/app/data \
  --restart unless-stopped \
  worktime-tracker
```

### Option 3: Node.js (Development)

```bash
git clone https://github.com/YOUR_USERNAME/worktime-tracker.git
cd worktime-tracker
npm install
npm start
```

## Unraid Setup

### Using Docker Compose Manager

1. Install "Docker Compose Manager" from Community Applications
2. Add new stack → Paste docker-compose.yml content
3. Deploy

### Manual Container Setup

1. Go to Docker → Add Container
2. Fill in:
   - **Name:** worktime-tracker
   - **Repository:** Build from GitHub or use your own image
   - **Port:** 3000:3000
   - **Path:** /app/data → /mnt/user/appdata/worktime-tracker

### With Reverse Proxy (Nginx Proxy Manager)

Add proxy host:
- Domain: `worktime.yourdomain.com`
- Forward: `worktime-tracker:3000`
- Enable SSL

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DB_PATH` | /app/data/worktime.db | SQLite database path |
| `NODE_ENV` | production | Environment mode |

### Data Persistence

The SQLite database is stored in `/app/data/worktime.db`. Mount this directory to persist data:

```yaml
volumes:
  - /your/local/path:/app/data
  # or use named volume
  - worktime-data:/app/data
```

## Backup & Restore

### Export via UI
1. Click Settings (⚙️)
2. Click "JSON Export"
3. Save the backup file

### Import via UI
1. Click Settings (⚙️)
2. Click "JSON Import"
3. Select your backup file

### Manual Backup
```bash
# Copy database from container
docker cp worktime-tracker:/app/data/worktime.db ./backup.db

# Restore
docker cp ./backup.db worktime-tracker:/app/data/worktime.db
docker restart worktime-tracker
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/entries | Get all entries |
| POST | /api/entries | Add entry |
| PUT | /api/entries/:id | Update entry |
| DELETE | /api/entries/:id | Delete entry |
| GET | /api/settings | Get settings |
| POST | /api/settings | Save settings |
| POST | /api/import | Import data |
| GET | /api/export | Export all data |
| GET | /api/health | Health check |

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, Recharts
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Container:** Alpine Linux, multi-stage build

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build Docker image
docker build -t worktime-tracker .
```

## License

MIT

---

Built to work less, not more. 🏖️
