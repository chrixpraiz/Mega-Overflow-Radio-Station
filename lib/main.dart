import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:just_audio/just_audio.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  MobileAds.instance.initialize();
  runApp(const MegaOverflowApp());
}

class MegaOverflowApp extends StatelessWidget {
  const MegaOverflowApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'MegaOverflow Radio',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.deepPurple),
      home: const RadioHome(),
    );
  }
}

class RadioHome extends StatefulWidget {
  const RadioHome({super.key});
  @override
  State<RadioHome> createState() => _RadioHomeState();
}

class _RadioHomeState extends State<RadioHome> {
  final AudioPlayer _player = AudioPlayer();
  bool isPlaying = false;
  bool isLoading = false;
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;
  final String streamUrl = 'https://stream.radiojar.com/kks1y4wm7s8uv';
  final String bannerId = 'ca-app-pub-3940256099942544/6300978111';

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd() {
    _bannerAd = BannerAd(
      adUnitId: bannerId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) => setState(() => _isAdLoaded = true),
        onAdFailedToLoad: (ad, err) { ad.dispose(); },
      ),
    )..load();
  }

  Future<void> togglePlay() async {
    try {
      if (isPlaying) {
        await _player.stop();
        setState(() => isPlaying = false);
      } else {
        setState(() => isLoading = true);
        await _player.setUrl(streamUrl);
        await _player.play();
        setState(() { isPlaying = true; isLoading = false; });
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  void dispose() { _player.dispose(); _bannerAd?.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF6A1B9A), Color(0xFF000000)])),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 40),
              Image.asset('assets/icon/app_icon.png', width: 180, height: 180, errorBuilder: (c,e,s) => const Icon(Icons.radio, size: 120, color: Colors.white)),
              const SizedBox(height: 20),
              const Text('MegaOverflow Radio', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
              const Text('LIVE 24/7', style: TextStyle(color: Colors.white70, fontSize: 16, letterSpacing: 2)),
              const Spacer(),
              if (isLoading) const CircularProgressIndicator(color: Colors.white) else
              GestureDetector(
                onTap: togglePlay,
                child: Container(width: 90, height: 90, decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 20)]), child: Icon(isPlaying ? Icons.stop : Icons.play_arrow, size: 50, color: Colors.deepPurple)),
              ),
              const SizedBox(height: 20),
              Text(isPlaying ? 'ON AIR' : 'TAP TO PLAY', style: const TextStyle(color: Colors.white70)),
              const Spacer(),
              if (_isAdLoaded && _bannerAd != null) Container(color: Colors.black, height: _bannerAd!.size.height.toDouble(), width: _bannerAd!.size.width.toDouble(), child: AdWidget(ad: _bannerAd!)) else const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }
}
