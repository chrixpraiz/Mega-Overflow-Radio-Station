import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:just_audio/just_audio.dart';
import 'package:url_launcher/url_launcher.dart';

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
      home: const MainTabs(),
    );
  }
}

class MainTabs extends StatefulWidget {
  const MainTabs({super.key});
  @override
  State<MainTabs> createState() => _MainTabsState();
}

class _MainTabsState extends State<MainTabs> {
  int _current = 0;
  final AudioPlayer _player = AudioPlayer();
  bool isPlaying = false;
  bool isLoading = false;
  String status = "TAP TO PLAY";
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;

  // Try these URLs - Radiojar sometimes needs .mp3
  final List<String> streamUrls = [
    'https://stream.radiojar.com/kks1y4wm7s8uv',
    'https://stream.radiojar.com/kks1y4wm7s8uv.mp3',
    'https://stream.radiojar.com/kks1y4wm7s8uv.m3u',
  ];

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd() {
    _bannerAd = BannerAd(
      adUnitId: 'ca-app-pub-3940256099942544/6300978111', // test, replace with yours
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(onAdLoaded: (_) => setState(() => _isAdLoaded = true), onAdFailedToLoad: (a,e){a.dispose();}),
    )..load();
  }

  Future<void> togglePlay() async {
    if (isPlaying) {
      await _player.stop();
      setState(() { isPlaying = false; status = "TAP TO PLAY"; });
      return;
    }
    setState(() { isLoading = true; status = "Connecting..."; });
    for (var url in streamUrls) {
      try {
        print("Trying: $url");
        await _player.setAudioSource(AudioSource.uri(Uri.parse(url)), preload: true);
        await _player.play();
        setState(() { isPlaying = true; isLoading = false; status = "ON AIR - LIVE"; });
        return;
      } catch (e) {
        print("Failed $url: $e");
        continue;
      }
    }
    setState(() { isLoading = false; status = "Error: Stream offline"; });
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Stream failed - check data connection")));
  }

  @override
  void dispose() { _player.dispose(); _bannerAd?.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildHome(),
      _buildAbout(),
      _buildContact(),
      _buildPrayer(),
    ];
    return Scaffold(
      body: pages[_current],
      bottomNavigationBar: Column(mainAxisSize: MainAxisSize.min, children: [
        if (_isAdLoaded && _bannerAd != null) Container(color: Colors.black, width: double.infinity, height: _bannerAd!.size.height.toDouble(), child: AdWidget(ad: _bannerAd!)),
        BottomNavigationBar(currentIndex: _current, onTap: (i)=>setState(()=>_current=i), type: BottomNavigationBarType.fixed, selectedItemColor: Colors.deepPurple, items: const [
          BottomNavigationBarItem(icon: Icon(Icons.radio), label: "Live"),
          BottomNavigationBarItem(icon: Icon(Icons.info), label: "About"),
          BottomNavigationBarItem(icon: Icon(Icons.call), label: "Contact"),
          BottomNavigationBarItem(icon: Icon(Icons.favorite), label: "Prayer"),
        ]),
      ]),
    );
  }

  Widget _buildHome() {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFF7B1FA2), Color(0xFF000000)])),
      child: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 30),
            Container(width: 160, height: 160, decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black45, blurRadius: 20)]), child: ClipRRect(borderRadius: BorderRadius.circular(20), child: Image.asset('assets/icon/app_icon.png', fit: BoxFit.cover, errorBuilder: (c,e,s)=> Container(color: Colors.orange, child: const Icon(Icons.mic, size: 80, color: Colors.white))))),
            const SizedBox(height: 20),
            const Text('MegaOverflow Radio', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const Text('LIVE 24/7', style: TextStyle(color: Colors.white70, letterSpacing: 3)),
            const Spacer(),
            if (isLoading) const CircularProgressIndicator(color: Colors.white) else GestureDetector(onTap: togglePlay, child: Container(width: 90, height: 90, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Icon(isPlaying ? Icons.stop_rounded : Icons.play_arrow_rounded, size: 55, color: Colors.deepPurple))),
            const SizedBox(height: 15),
            Text(status, style: const TextStyle(color: Colors.white70)),
            const Spacer(),
            const Padding(padding: EdgeInsets.all(16), child: Text('24/7 Gospel • Worship • Word', style: TextStyle(color: Colors.white38, fontSize: 12))),
          ],
        ),
      ),
    );
  }

  Widget _buildAbout() => const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('MegaOverflow Radio is a 24/7 Gospel station spreading the overflow of God\'s love worldwide.', textAlign: TextAlign.center, style: TextStyle(fontSize: 16))));
  Widget _buildContact() => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.call, size: 60, color: Colors.deepPurple), const SizedBox(height: 20), ElevatedButton(onPressed: () async { final uri = Uri.parse('tel:+2340000000000'); if (await canLaunchUrl(uri)) await launchUrl(uri); }, child: const Text('Call Us')), const SizedBox(height: 10), ElevatedButton(onPressed: () async { final uri = Uri.parse('https://wa.me/2340000000000'); if (await canLaunchUrl(uri)) await launchUrl(uri); }, child: const Text('WhatsApp'))]));
  Widget _buildPrayer() => const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('Send your prayer request - We are praying with you!', textAlign: TextAlign.center)));
}
