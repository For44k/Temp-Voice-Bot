<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,18,24&height=180&section=header&text=One%20Tap%20Voice&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=One%20Tap%20Discord%20Temporary%20Voice%20Management&descFontSize=16&descAlignY=58" width="100%" />

  <p align="center">
    <a href="https://discord.js.org"><img src="https://img.shields.io/badge/Discord.js-v14.18-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge&logo=opensourceinitiative&logoColor=black" alt="License" /></a>
  </p>

  <p align="center">
    <b>An ultra-fast, production-grade temporary voice channel management bot built with native Discord Components V2, in-memory caching, and sub-350ms channel creation latency.</b>
  </p>

  <p align="center">
    <a href="#-key-highlights">Highlights</a> •
    <a href="#-architecture--performance">Architecture</a> •
    <a href="#-installation--setup">Setup</a> •
    <a href="#-commands--controls">Commands</a> •
    <a href="#-license">License</a>
  </p>

  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" />
</div>

<br/>

## ⚡ Key Highlights

<table>
  <tr>
    <td width="50%">
      <h3 align="left"><img src="https://api.iconify.design/lucide:zap.svg?color=%235865F2" width="18"/> Sub-350ms Creation Latency</h3>
      <p>Direct room allocation with immediate member relocation and non-blocking parallel permission setup.</p>
    </td>
    <td width="50%">
      <h3 align="left"><img src="https://api.iconify.design/lucide:layout-grid.svg?color=%235865F2" width="18"/> Discord Components V2 UI</h3>
      <p>Native dynamic containers, separators, and media galleries matching server theme palettes.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="left"><img src="https://api.iconify.design/lucide:shield-check.svg?color=%235865F2" width="18"/> Automated Anti-Abuse Engine</h3>
      <p>Real-time detection and disconnection of spam joiners with inline permit/deny moderation buttons.</p>
    </td>
    <td width="50%">
      <h3 align="left"><img src="https://api.iconify.design/lucide:crown.svg?color=%235865F2" width="18"/> Smart Ownership Lifecycle</h3>
      <p>Automatic room claim prompts upon owner departure with dynamic message updates on owner return or claim.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="left"><img src="https://api.iconify.design/lucide:database.svg?color=%235865F2" width="18"/> In-Memory Store & Sync</h3>
      <p>Zero database stalls during interactions via memory-backed stores with async write-behind MongoDB persistence.</p>
    </td>
    <td width="50%">
      <h3 align="left"><img src="https://api.iconify.design/lucide:sparkles.svg?color=%235865F2" width="18"/> Dynamic Developer Emojis</h3>
      <p>Startup synchronization with application emojis on the Discord Developer Portal with fallback support.</p>
    </td>
  </tr>
</table>

<br/>

##  Architecture & Performance

```mermaid
flowchart LR
    A[User Joins Generator] --> B[Direct Channel Create]
    B --> C[Immediate Member Move]
    C --> D[Background Permissions & Overwrites]
    D --> E[In-Memory Cache Sync]
    E --> F[Async MongoDB Write-Behind]
```

- **Memory Footprint**: ~20MB RAM under PM2 execution.
- **CPU Idle**: < 0.1% CPU consumption.
- **Interaction Response**: Instant ephemeral interaction updates.

<br/>

##  Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/onetap-voice.git
cd onetap-voice
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create your `.env` configuration:
```bash
cp .env.example .env
```

```ini
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
MONGODB_URI=mongodb://localhost:27017/onetap_voice
DEFAULT_PREFIX=.v
AUTO_LOAD_EMOJIS=true
```

### 4. Build & Start
```bash
# Build TypeScript
npm run build

# Start Production Server
npm start
```

<br/>

## 🎮 Commands & Controls

<details open>
<summary><b>Voice Channel Management</b></summary>
<br/>

| Command | Syntax | Description |
| :--- | :--- | :--- |
| **Setup** | `.v setup` | Launch interactive setup for generators, categories, themes & panels |
| **Panel** | `.v panel` | Send the voice channel control panel to your room |
| **Need Help** | `.v needhelp` | Relocate to the configured Need Help voice room (15s cooldown) |
| **Lock / Unlock** | `.v lock` / `.v unlock` | Lock or unlock your room to prevent new connections |
| **Hide / Unhide** | `.v hide` / `.v unhide` | Toggle room visibility for unauthorized users |
| **Rename** | `.v name <name>` | Change voice room name |
| **Limit** | `.v limit <0-99>` | Adjust user connection limit |
| **Permit** | `.v permit <@user>` | Allow specific users or roles into your room |
| **Reject** | `.v reject <@user>` | Disconnect and ban users from joining your room |
| **Claim** | `.v claim` | Claim ownership of an abandoned voice room |
| **Info** | `.v info` | View detailed real-time channel statistics and duration |
| **Anti-Abuse** | `.v ab` | Toggle the anti-abuse shield for your room |

</details>

<br/>

##  Discord Privileged Intents

Make sure to enable all Privileged Gateway Intents in the **[Discord Developer Portal](https://discord.com/developers/applications)**:
- `PRESENCE INTENT`
- `SERVER MEMBERS INTENT`
- `MESSAGE CONTENT INTENT`

<br/>

##  License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,18,24&height=100&section=footer" width="100%"/>
</div>
