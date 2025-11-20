# 👻 Haunted AWS Cost Guard - User Guide

Welcome to the most spooky AWS cost monitoring experience! This guide will help you navigate through our supernatural dashboard and master the art of haunted cost management.

## 🎃 Table of Contents

1. [Getting Started](#getting-started)
2. [Mode Selection](#mode-selection)
3. [Navigating the Haunted Mansion](#navigating-the-haunted-mansion)
4. [Understanding Supernatural Entities](#understanding-supernatural-entities)
5. [Cost Detail Analysis](#cost-detail-analysis)
6. [Budget Management](#budget-management)
7. [Export and Sharing](#export-and-sharing)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Features](#advanced-features)

## 🏚️ Getting Started

### First Launch

When you first open the Haunted AWS Cost Guard, you'll be greeted with our spooky mode selection screen. This is where your supernatural journey begins!

**What you'll see:**
- A dark, atmospheric interface with Halloween-themed colors
- Two main options: Demo Mode and AWS Account Mode
- Helpful descriptions for each mode

### System Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Screen Resolution**: Minimum 1024x768 (responsive design adapts to all sizes)
- **Internet Connection**: Required for AWS mode, optional for demo mode
- **JavaScript**: Must be enabled

## 🎭 Mode Selection

### Demo Mode 👻

Perfect for exploring the application without AWS credentials or for demonstrations.

**Features:**
- Pre-loaded sample data representing various AWS spending scenarios
- All functionality available without authentication
- Multiple scenario options (Peaceful Manor, Restless Spirits, Haunted Chaos)
- Safe environment for learning and testing

**How to use:**
1. Click the "Demo Mode" button on the welcome screen
2. Select a scenario from the dropdown (optional)
3. The haunted mansion will load with sample data
4. Explore all features risk-free!

### AWS Account Mode 🔐

Connect your real AWS account for live cost monitoring.

**Prerequisites:**
- Valid AWS credentials with Cost Explorer permissions
- IAM permissions for billing data access
- Or a CSV export from AWS Cost Explorer

**Setup Options:**

#### Option 1: Direct AWS Credentials
1. Click "AWS Account" on the welcome screen
2. Enter your AWS Access Key ID
3. Enter your AWS Secret Access Key
4. Select your preferred region
5. Click "Validate Credentials"

#### Option 2: CSV Upload
1. Export data from AWS Cost Explorer as CSV
2. Click "Upload CSV" tab
3. Drag and drop your CSV file or click to browse
4. The system will validate and process your data

**Required IAM Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetUsageReport",
        "budgets:ViewBudget"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🏰 Navigating the Haunted Mansion

### Mansion Layout

The haunted mansion is organized into distinct rooms, each representing a different AWS service category:

- **🏚️ EC2 Crypt**: Compute instances and related services
- **🗄️ S3 Storage Cellar**: Object storage and data transfer
- **🏛️ RDS Database Dungeon**: Relational database services
- **⚡ Lambda Spirit Chamber**: Serverless functions
- **🎪 Other Services Attic**: All remaining AWS services

### Room Interactions

**Hovering over rooms:**
- Reveals cost tooltips
- Activates supernatural effects
- Shows service name and current spending

**Clicking on rooms:**
- Opens detailed cost breakdown panel
- Displays charts and analytics
- Shows regional and tag-based data

### Visual Indicators

The mansion uses supernatural entities to represent cost levels:

| Entity Type | Cost Level | Visual Appearance |
|-------------|------------|-------------------|
| 👻 Peaceful Ghost | 0-50% of budget | Faint, slow-moving spirits |
| 😈 Agitated Spirit | 50-100% of budget | Red mist, faster movement |
| 👹 Boss Monster | 100%+ of budget | Large, intense animations |

## 🔮 Understanding Supernatural Entities

### Entity Behavior

**Peaceful Ghosts (Low Cost)**
- Gentle floating animations
- Soft, ethereal colors (blue/white)
- Minimal particle effects
- Calm, reassuring presence

**Agitated Spirits (Medium Cost)**
- More erratic movement patterns
- Orange/red color scheme
- Increased particle density
- Warning-level visual intensity

**Boss Monsters (High Cost/Over Budget)**
- Dramatic, attention-grabbing animations
- Intense red/black colors
- Heavy particle effects and screen shake
- Urgent visual alerts

### Animation Performance

The system automatically adjusts animation quality based on your device's performance:
- **High Performance**: Full effects, 60 FPS animations
- **Medium Performance**: Reduced particle count, 30 FPS
- **Low Performance**: Simplified animations, essential effects only

## 📊 Cost Detail Analysis

### Opening Detail Panels

Click any room to open its detailed cost analysis panel. The panel slides in from the right and contains:

### Cost Overview Section
- **Total Cost**: Current month's spending
- **Budget Utilization**: Percentage of budget consumed
- **Trend Indicator**: Increasing/decreasing/stable
- **Last Updated**: Data freshness timestamp

### Interactive Charts

**Daily Cost Trend**
- Line chart showing daily spending over the selected period
- Hover for specific day details
- Click and drag to zoom into time ranges

**Regional Breakdown**
- Pie chart of costs by AWS region
- Click segments to filter other charts
- Hover for percentage and absolute values

**Tag Analysis**
- Bar chart of costs by resource tags
- Useful for project/team cost allocation
- Sortable by cost amount or tag name

### Navigation Controls

- **Close Button**: X in top-right corner
- **Expand/Collapse**: Toggle full-screen mode
- **Export**: Save chart data or images
- **Refresh**: Update with latest data

## 💰 Budget Management

### Accessing Budget Settings

1. Click the "Budget Settings" button (💰 icon) in the top navigation
2. The budget panel slides in from the left
3. View current budget configurations

### Setting Service Budgets

**For individual services:**
1. Find the service in the budget list
2. Click the edit button (✏️) next to the amount
3. Enter your desired budget amount
4. Select the time period (monthly/quarterly/yearly)
5. Set alert thresholds (e.g., 50%, 80%, 100%)
6. Click "Save"

**For account-wide budgets:**
1. Use the "Overall Budget" section at the top
2. Set a total account spending limit
3. The system will proportionally allocate to services

### Alert Thresholds

Configure when you want to be notified:
- **50% threshold**: Early warning (peaceful ghosts become slightly agitated)
- **80% threshold**: Serious warning (agitated spirits appear)
- **100% threshold**: Critical alert (boss monsters emerge)

### Budget Notifications

The system provides visual and textual alerts:
- **In-app notifications**: Toast messages for threshold breaches
- **Visual changes**: Entity transformations in real-time
- **Email alerts**: (Coming soon) External notifications

## 📤 Export and Sharing

### Export Options

Access the export panel by clicking the "Export" button (📊 icon).

**Available Formats:**

#### PDF Export
- **Visual Report**: Includes mansion screenshot and charts
- **Data Report**: Tables and summaries only
- **Combined**: Both visual and data elements
- Perfect for presentations and executive reports

#### JSON Export
- Raw cost data in structured format
- Suitable for further analysis or integration
- Includes metadata and timestamps
- Developer-friendly format

#### CSV Export
- Spreadsheet-compatible format
- Easy import into Excel or Google Sheets
- Includes all cost breakdowns and tags
- Great for financial analysis

### Sharing Features

**Shareable Links**
1. Click "Generate Share Link" in the export panel
2. Copy the provided URL
3. Share with team members
4. Recipients see a read-only version of your current view

**Snapshot Sharing**
1. Click "Create Snapshot"
2. The system captures current mansion state
3. Generate a permanent link to this moment in time
4. Useful for historical comparisons

## 🔧 Troubleshooting

### Common Issues

**"The mansion spirits are resting" Error**
- **Cause**: Network connectivity issues or server problems
- **Solution**: Check internet connection, try refreshing the page
- **Fallback**: Switch to demo mode temporarily

**Slow Performance/Choppy Animations**
- **Cause**: Device performance limitations
- **Solution**: The system auto-adjusts, but you can manually reduce quality in settings
- **Alternative**: Use a more powerful device or close other browser tabs

**AWS Credentials Not Working**
- **Cause**: Insufficient permissions or incorrect credentials
- **Solution**: Verify IAM permissions, check for typos in credentials
- **Workaround**: Use CSV upload method instead

**Charts Not Loading**
- **Cause**: Ad blockers or browser security settings
- **Solution**: Whitelist the application domain
- **Alternative**: Try a different browser

### Performance Optimization

**For better performance:**
- Close unnecessary browser tabs
- Use Chrome or Edge for best Canvas performance
- Ensure your device has adequate RAM (4GB+ recommended)
- Update your browser to the latest version

**If experiencing issues:**
- Try demo mode first to isolate AWS-related problems
- Check browser console for error messages
- Clear browser cache and cookies
- Disable browser extensions temporarily

## 🎯 Advanced Features

### Keyboard Shortcuts

- **Tab**: Navigate between interactive elements
- **Enter**: Activate focused buttons or links
- **Escape**: Close open panels
- **Arrow Keys**: Navigate within charts and data tables
- **Space**: Toggle animations on/off

### Accessibility Features

**Screen Reader Support**
- All visual elements have descriptive text
- Cost data is announced when rooms are focused
- Chart data is available in table format

**High Contrast Mode**
- Automatically detects system preference
- Enhanced color contrast for better visibility
- Simplified visual effects for clarity

**Keyboard Navigation**
- Full functionality available without mouse
- Clear focus indicators
- Logical tab order throughout the interface

### URL Parameters

You can bookmark specific views using URL parameters:

- `?mode=demo` - Start in demo mode
- `?scenario=chaos` - Load specific demo scenario
- `?service=ec2` - Open with EC2 detail panel
- `?theme=light` - Use light theme (if available)

### Integration Options

**API Access**
- RESTful API available at `/api-docs`
- JSON responses for all data endpoints
- Suitable for custom integrations

**Webhook Support** (Coming Soon)
- Real-time notifications for budget alerts
- Custom endpoint configuration
- Slack/Teams integration options

## 🎉 Tips for Best Experience

1. **Start with Demo Mode**: Familiarize yourself with the interface before connecting AWS
2. **Set Realistic Budgets**: Use historical data to set achievable budget targets
3. **Regular Monitoring**: Check the mansion daily for early warning signs
4. **Use Tags Effectively**: Proper resource tagging improves cost breakdown accuracy
5. **Export Regularly**: Keep historical snapshots for trend analysis
6. **Share with Team**: Use sharing features for collaborative cost management

## 🆘 Getting Help

**Documentation**
- API Documentation: `/api-docs`
- Technical Documentation: `docs/technical-guide.md`
- Deployment Guide: `docs/deployment.md`

**Support Channels**
- GitHub Issues: Report bugs and feature requests
- Community Forum: Share tips and get help from other users
- Email Support: Contact our haunted support team

**Contributing**
- Fork the repository on GitHub
- Submit pull requests for improvements
- Report issues and suggest enhancements
- Help improve documentation

---

*Happy Haunting! May your AWS costs be forever under control! 👻🎃*