# Welcome to TicTacToe! 🧠🎮

This is an advanced, single-player Tic Tac Toe game built with [Expo](https://expo.dev) and React Native. Created as a comprehensive technical demonstration showcasing modern mobile development practices, persistent state management, adaptive AI algorithms, and clean architectural patterns.

---

## 📹 Demo Recording

See a walkthrough of the app in action:  
▶️ [View Demo Video](https://drive.google.com/file/d/1YiIPieoTKSsEkLUasx_Pzq1OVlesy3t4/view)

---

## 🖼️ Screenshots

<p align="center">
  <img src="assets/images/screenshots.png" alt="Screenshots" width="1000" />
</p>

---

## 🚀 What's Inside

This project includes all the features of a production-ready mobile game:

✅ **Single-player game mode** with intelligent, adaptive AI opponents  
✅ **Three AI difficulty levels** - Easy (random), Medium (strategic), Hard (unbeatable minimax)  
✅ **Clean component architecture** using `expo-router` for navigation  
✅ **SQLite integration** for persistent game history, user profiles, and settings  
✅ **User management system** with username customization and profile colors  
✅ **Smart dark/light theme support** with automatic system preference detection  
✅ **Immersive sound effects** using `expo-audio` for enhanced gameplay  
✅ **Game history viewer** with interactive replay functionality  
✅ **Comprehensive statistics tracking** - win rates, game duration, move analysis  
✅ **TypeScript implementation** across the entire codebase with strict type safety  
✅ **Redux state management** for global app state and user sessions  
✅ **Animated UI components** with smooth transitions and micro-interactions  
✅ **Responsive design** that adapts to different screen sizes  
✅ **Jest test suite** covering core game logic and algorithms  
✅ **Clean code practices** with detailed comments and documentation

---

## 🛠️ Prerequisites

Before you start, ensure you have the following installed on your system:

### 1. **Node.js**

- Download and install Node.js (v18 or higher) from the [official website](https://nodejs.org/)
- Verify installation:

  **Mac/Linux** (bash/zsh):

  ```bash
  node -v
  npm -v
  ```

  **Windows Command Prompt**:

  ```cmd
  node -v
  npm -v
  ```

  **Windows PowerShell**:

  ```powershell
  node -v
  npm -v
  ```

### 2. **Yarn Package Manager**

If Yarn isn't installed, run:

- **Mac/Linux**:

  ```bash
  npm install -g yarn
  ```

- **Windows CMD**:

  ```cmd
  npm install -g yarn
  ```

- **Windows PowerShell**:

  ```powershell
  npm install -g yarn
  ```

### 3. **Local Expo CLI**

The Local Expo CLI is automatically installed as a project dependency. No global installation needed.

### 4. **Mobile Development Environment** (Optional)

For testing on simulators/emulators:

- **iOS**: Xcode and iOS Simulator (Mac only)
- **Android**: Android Studio and Android Emulator

---

## ⚙️ Setup Guide

### Step 1: Clone the Repository

**Mac/Linux**:

```bash
git clone https://github.com/vrinch/tictactoe.git
cd tictactoe
```

**Windows CMD**:

```cmd
git clone https://github.com/vrinch/tictactoe.git
cd tictactoe
```

**Windows PowerShell**:

```powershell
git clone https://github.com/vrinch/tictactoe.git
cd tictactoe
```

### Step 2: Clean Installation (if updating)

**Mac/Linux**:

```bash
rm -rf node_modules yarn.lock
```

**Windows CMD**:

```cmd
rmdir /s /q node_modules
del yarn.lock
```

**Windows PowerShell**:

```powershell
Remove-Item -Recurse -Force node_modules, yarn.lock
```

### Step 3: Install Dependencies

**All platforms**:

```bash
yarn
```

### Step 4: Start the Development Server

**All platforms**:

```bash
npx expo start
```

For production mode testing - USE THIS ✅:

```bash
npx expo start --no-dev --minify
```

---

## 📱 Testing the App

### Option 1: Download Pre-built Clients

#### **Android Users**

- **APK Download**: [Direct APK Link](https://expo.dev/artifacts/eas/pLiNV9pDNKJiNdPutuntHJ.apk)
- **Expo Dev Client**: [Android Dev Build](https://expo.dev/accounts/kingpoolapp/projects/tictactoe/builds/cdb7903b-b72c-43e8-85dc-0acf38d6e5c7)

#### **iOS Users**

- **Contact for Physical Device Access**: Due to iOS distribution requirements, please contact me directly for setup and access to test on physical iOS devices.
- **iOS Simulator**: Available for Mac users through Xcode

### Option 2: Build for Your Device

#### Using Expo Prebuild (Recommended for Testing)

**For Android**:

```bash
npx expo prebuild --platform android
npx expo run:android
```

**For iOS** (Mac only):

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

### Option 3: Device Simulators/Emulators

**iOS Simulator** (Mac only):

```bash
npx expo start --ios
```

**Android Emulator**:

```bash
npx expo start --android
```

#### Using Expo Go (Limited Features)

1. Install Expo Go from App Store/Play Store
2. Scan QR code from `npx expo start`
3. Note: This app contains native packages that may not work properly in Expo Go. For the full experience, please use the development build options above or download the pre-built clients.

---

## 📱 How to Play

### 🎯 Getting Started

1. Launch the app and complete the interactive walkthrough
2. Create your unique username and select a profile color
3. Choose your preferred settings (AI difficulty, sound effects, etc.)
4. Tap **New Game** to begin your first match, if it has't started already

### 🎮 Gameplay Features

- **Adaptive AI**: Three difficulty levels that scale from random play to unbeatable strategy
- **Game Modes**: Quick play with customizable settings
- **Real-time Stats**: Track your performance with detailed statistics
- **Sound & Haptics**: Immersive audio feedback and vibration responses

### 🏆 Game History & Replay

- View detailed history of all your games
- Replay any previous game move-by-move
- Analyze your playing patterns and improvement over time
- Export game data (coming soon)

### ⚙️ Customization Options

- **Profile Settings**: Update username, profile color, and preferences
- **Game Settings**: AI difficulty, auto-reset board, reset delays
- **Audio & Haptics**: Toggle sound effects and vibration feedback
- **Theme Support**: Automatic light/dark mode based on device preference

---

## 🧠 AI Difficulty Explained

### 🟢 Easy Mode

- **Strategy**: Random valid moves
- **Perfect for**: New players learning the game
- **Win Rate**: High player win percentage

### 🟡 Medium Mode

- **Strategy**: Strategic blocking and winning moves
- **Algorithm**: Rule-based decision making with tactical awareness
- **Perfect for**: Intermediate players seeking a challenge

### 🔴 Hard Mode

- **Strategy**: Unbeatable minimax algorithm with alpha-beta pruning
- **Algorithm**: Perfect play calculation of all possible game states
- **Perfect for**: Expert players wanting the ultimate challenge
- **Result**: Best possible outcome is a tie against perfect play

---

## 🧪 Testing & Quality Assurance

### Running Tests

Execute the comprehensive test suite:

```bash
yarn test
```

### Test Coverage

- **Game Logic**: Win condition detection, board state management
- **AI Algorithms**: Move calculation accuracy across all difficulty levels
- **Utility Functions**: Data validation, storage operations, helper functions
- **Component Logic**: User interaction handling, state updates

### Manual Testing Checklist

- [ ] User registration and profile creation
- [ ] Game state persistence across app restarts
- [ ] All AI difficulty levels respond correctly
- [ ] Sound effects and haptic feedback work
- [ ] Theme switching (light/dark mode)
- [ ] Game history and replay functionality
- [ ] Settings persistence and updates

---

## 🏗️ Architecture Overview

### 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/          # App constants and configuration
├── hooks/              # Custom React hooks
├── redux/              # State management (actions, reducers)
├── utils/              # Helper functions and utilities
├── app/                # Screen components with file-based routing
└── types/              # TypeScript type definitions
```

### 🔧 Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Redux with Redux Toolkit
- **Database**: SQLite with Expo SQLite
- **Styling**: StyleSheet with responsive scaling
- **Audio**: Expo Audio for sound effects
- **Animations**: React Native Reanimated 3
- **Testing**: Jest with React Native Testing Library
- **Language**: TypeScript with strict type checking

---

## 🌗 Theme Support

The app features comprehensive theming support:

- **Automatic Detection**: Inherits system preference (light/dark)
- **Consistent Colors**: Semantic color system across all components
- **Smooth Transitions**: Animated theme switching
- **Accessibility**: High contrast ratios and readable color combinations

---

## 🎯 Possible Enhancements

Here are planned features and improvements for future releases:

### 🎮 Core Gameplay Enhancements

- **Advanced AI Integration**: Play against actual AI models with machine learning capabilities
- **Voice-Controlled Gameplay**: Use voice commands to make moves ("Top left", "Center", etc.)
- **Multiplayer Mode**: Share invite links to play with friends in real-time
- **Tournament Mode**: Bracket-style competitions with AI or players
- **Daily Challenges**: Special puzzle modes and brain teasers

### 🎨 Social & Sharing Features

- **Share & Invite System**: Generate shareable links for multiplayer games
- **Social Profiles**: Connect with friends and view their game statistics
- **Achievement Sharing**: Share accomplishments on social media
- **Replay Sharing**: Share interesting game replays with custom commentary
- **Leaderboards**: Global and friend-based competitive rankings

### 🎤 Voice & Accessibility

- **Voice Commands**: Navigate menus and make moves using speech
- **Audio Descriptions**: Complete game state narration for visually impaired users
- **Voice Feedback**: Audio confirmation of moves and game status
- **Multiple Language Support**: Voice commands in different languages

### 📊 Advanced Analytics & Statistics

- **Heat Maps**: Visual representation of most/least played board positions
- **Performance Insights**: AI-powered analysis of playing patterns and improvement suggestions
- **Advanced Stats**: Move frequency analysis, average game duration, win streaks
- **Data Export**: CSV/JSON export for external analysis
- **Cloud Sync**: Cross-device synchronization of progress and settings

### 🎨 UI/UX Improvements

- **Advanced Animations**: Smooth piece placement and board transitions with physics
- **Custom Themes**: Multiple color schemes, seasonal themes, and visual styles
- **Dynamic Backgrounds**: Animated backgrounds and particle effects
- **Haptic Patterns**: Advanced vibration feedback for different game events
- **Interactive Tutorial**: Guided gameplay with contextual tips and strategies

### 🔧 Technical Enhancements

- **Offline-First Architecture**: Robust offline gameplay with seamless cloud synchronization
- **Real-time Multiplayer**: WebSocket-based real-time gameplay with low latency
- **AI Model Training**: Allow users to train custom AI opponents
- **Performance Optimization**: Advanced memoization and rendering optimizations
- **E2E Testing**: Comprehensive end-to-end testing with Detox

### 🌐 Platform Features

- **Profile Image Upload**: Custom profile pictures with avatar customization
- **Deep Linking**: Share and open specific game states or challenges
- **Push Notifications**: Game reminders, friend challenges, and achievement notifications
- **Widget Support**: Home screen widgets for quick game access and stats
- **Apple Watch/Wear OS**: Companion apps for wearable devices
- **Desktop Version**: Cross-platform desktop application with cloud sync

---

## 📚 Learn More

### Expo Ecosystem

- [Expo Documentation](https://docs.expo.dev/) - Complete Expo development guide
- [Learn Expo Tutorial](https://docs.expo.dev/tutorial/introduction/) - Step-by-step tutorials
- [Expo Router](https://docs.expo.dev/routing/introduction/) - File-based routing system

### React Native Resources

- [React Native Documentation](https://reactnative.dev/) - Official React Native docs
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Animation library
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) - Testing utilities

### Game Development

- [Minimax Algorithm](https://en.wikipedia.org/wiki/Minimax) - AI strategy explanation
- [Alpha-Beta Pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning) - Optimization technique
- [Game Theory Basics](https://en.wikipedia.org/wiki/Game_theory) - Mathematical game analysis

---

## 🤝 Join the Community

### Development Resources

- [Expo on GitHub](https://github.com/expo/expo) - Open source Expo platform
- [Discord Community](https://chat.expo.dev) - Real-time developer support
- [Expo Forums](https://forums.expo.dev/) - Community discussions and help

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description
4. Ensure all tests pass and code follows style guidelines

### Support & Contact

- **Bug Reports**: Create an issue on GitHub
- **Feature Requests**: Use GitHub discussions
- **Direct Contact**: Reach out for iOS TestFlight access or technical questions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Expo Team** for the incredible development platform
- **React Native Community** for continuous innovation
- **Game Theory Researchers** for AI algorithm foundations
- **Open Source Contributors** for the libraries and tools used

---

**Built with ❤️ using React Native + Expo SDK 53**

_Ready to test your strategic thinking? Download and play TicTacToe today!_
