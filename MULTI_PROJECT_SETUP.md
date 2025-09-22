# Managing Multiple React Native Projects

## Common Issues & Solutions

### React Native Version Mismatch Error
When working with multiple React Native projects with different versions, you may encounter:
```
React Native version mismatch.
JavaScript version: 0.79.4
Native version: 0.81.4
```

This happens because Metro bundler and native builds can cache data from other projects.

## Project-Specific Setup

### 1. Environment Configuration

Create a `.env` file in your project root to use a unique Metro port:
```bash
echo "RCT_METRO_PORT=8084" > .env
```

### 2. Available Scripts

This project includes several scripts to help manage builds and avoid conflicts:

| Script | Command | Description |
|--------|---------|-------------|
| `start:reset` | `npm run start:reset` | Start Expo with cleared cache |
| `ios:clean` | `npm run ios:clean` | Clean iOS build folder and reinstall pods |
| `ios:clean-build` | `npm run ios:clean-build` | Clean and rebuild iOS app |
| `clean:all` | `npm run clean:all` | Complete project reset (nuclear option) |

## Best Practices for Multiple Projects

### Before Switching Projects

1. **Kill all Metro bundlers**
   ```bash
   # Find and kill processes on port 8081
   lsof -i :8081 | grep LISTEN | awk '{print $2}' | xargs kill -9
   
   # Or kill all Metro processes
   pkill -f metro
   ```

2. **Clear Watchman cache**
   ```bash
   watchman watch-del-all
   ```

3. **Clear project-specific Xcode derived data**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/chefiqstudioapp-*
   ```

### Starting a Project

#### Quick Start (if no issues)
```bash
npm start
# In another terminal
npm run ios
```

#### Clean Start (recommended when switching projects)
```bash
# Terminal 1: Start Metro with cache reset
npm run start:reset

# Terminal 2: Clean build iOS
npm run ios:clean-build
```

#### Nuclear Option (if persistent issues)
```bash
npm run clean:all
npm run prebuild
npm run ios
```

## Port Management Strategy

Assign each project a unique port to avoid conflicts:

| Project | Metro Port | Usage |
|---------|------------|-------|
| Project 1 | 8081 | Default |
| Project 2 | 8082 | `npx react-native start --port 8082` |
| Project 3 | 8083 | `npx react-native start --port 8083` |
| This Project | 8084 | Set in `.env` file |

## Troubleshooting Guide

### Issue: Metro bundler won't start
**Solution:**
```bash
# Kill existing Metro instances
pkill -f metro
# Clear Metro cache
npx react-native start --reset-cache
```

### Issue: iOS build fails with pod errors
**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
npm run ios
```

### Issue: Version mismatch persists
**Solution:**
```bash
# 1. Clear all caches
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*

# 2. Clear Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 3. Clean and rebuild
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Issue: Multiple projects interfering
**Solution:**
1. Use different simulator devices for each project
2. Use different Metro ports (configured in `.env`)
3. Clear caches between project switches

## Quick Reference Commands

```bash
# Check what's running on ports
lsof -i :8081
lsof -i :8082
lsof -i :8083
lsof -i :8084

# Kill specific port
kill -9 $(lsof -t -i:8081)

# Check running simulators
xcrun simctl list devices | grep Booted

# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Project-specific clean start
npm run clean:all && npm run ios:clean-build
```

## Recommended Workflow

1. **Dedicate terminals per project** - Keep separate terminal windows/tabs for each project
2. **Use unique ports** - Configure each project with its own Metro port
3. **Clean switch** - Always clear caches when switching between projects
4. **Consistent simulator** - Use the same simulator device for each specific project

## Additional Tips

- Consider using [direnv](https://direnv.net/) to automatically load project-specific environment variables
- Use terminal multiplexers like [tmux](https://github.com/tmux/tmux) or [iTerm2](https://iterm2.com/) profiles for project separation
- Keep a project-specific `.nvmrc` file if using different Node versions
- Document your project's React Native version in the README

## Project Information

- **React Native Version**: 0.81.4
- **Expo SDK**: 54
- **Default Metro Port**: 8084 (configured in `.env`)
- **Package Manager**: npm

## Related Documentation

- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Expo Documentation](https://docs.expo.dev/)
- [Metro Configuration](https://metrobundler.dev/docs/configuration)