import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:url_launcher/url_launcher.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await JustAudioBackground.init(
    androidNotificationChannelId: 'com.megaoverflowradio.channel.audio',
    androidNotificationChannelName: 'MOR Radio',
    androidNotificationOngoing: true,
  );
  // Anonymous login for community
  if (FirebaseAuth.instance.currentUser == null) {
    await FirebaseAuth.instance.signInAnonymously();
  }
  runApp(const MegaOverflowApp());
}

class MegaOverflowApp extends StatelessWidget {
  const MegaOverflowApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'MegaOverflow Radio',
      theme: ThemeData(primarySwatch: Colors.deepPurple, textTheme: GoogleFonts.poppinsTextTheme()),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});
  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  final _pages = const [RadioTab(), BibleTab(), LibraryTab(), CommunityTabB(), FormsTab(), ProfileTab()];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex, type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.deepPurple,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.radio), label: 'Radio'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: 'Bible'),
          BottomNavigationBarItem(icon: Icon(Icons.library_books), label: 'Library'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Community'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt), label: 'Forms'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

// RADIO TAB - Same as before
class RadioTab extends StatefulWidget {
  const RadioTab({super.key});
  @override
  State<RadioTab> createState() => _RadioTabState();
}
class _RadioTabState extends State<RadioTab> {
  final _player = AudioPlayer();
  bool _playing = false; bool _loading = false;
  final String streamUrl = "https://stream.radiojar.com/kks1y4wm7s8uv";
  Future<void> _toggle() async {
    try {
      setState(() => _loading = true);
      if (_playing) { await _player.stop(); setState(() { _playing = false; _loading = false; }); }
      else {
        await _player.setAudioSource(AudioSource.uri(Uri.parse(streamUrl), tag: MediaItem(id: '1', title: 'MegaOverflow Radio - Live Gospel 24/7')));
        await _player.play(); setState(() { _playing = true; _loading = false; });
      }
    } catch (e) { setState(() => _loading = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e"))); }
  }
  @override
  void dispose() { _player.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("MEGAOVERFLOW RADIO"), backgroundColor: Colors.deepPurple, foregroundColor: Colors.white),
      body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.radio, size: 120, color: Colors.deepPurple.shade300),
        const SizedBox(height: 20),
        Text(_playing? "LIVE NOW" : "OFFLINE", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: _playing? Colors.green : Colors.grey)),
        const SizedBox(height: 30),
        _loading? const CircularProgressIndicator() :
        ElevatedButton.icon(style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple, padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 18)), onPressed: _toggle, icon: Icon(_playing? Icons.stop : Icons.play_arrow, color: Colors.white), label: Text(_playing? "STOP" : "PLAY LIVE", style: const TextStyle(color: Colors.white, fontSize: 18))),
      ])),
    );
  }
}

// BIBLE TAB
class BibleTab extends StatelessWidget {
  const BibleTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text("KJV Bible"), backgroundColor: Colors.deepPurple, foregroundColor: Colors.white),
      body: ListView(children: const [ListTile(title: Text("Genesis 1:1"), subtitle: Text("In the beginning God created...")), ListTile(title: Text("Psalm 91"), subtitle: Text("He that dwelleth..."))]),
    );
  }
}

// LIBRARY TAB - Firebase Storage
class LibraryTab extends StatefulWidget {
  const LibraryTab({super.key});
  @override
  State<LibraryTab> createState() => _LibraryTabState();
}
class _LibraryTabState extends State<LibraryTab> {
  List<Reference> _files = []; bool _load = true;
  @override
  void initState() { super.initState(); _loadFiles(); }
  Future<void> _loadFiles() async {
    try {
      var result = await FirebaseStorage.instance.ref('ebooks').listAll();
      setState(() { _files = result.items; _load = false; });
    } catch (e) { setState(() => _load = false); }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Library - Firebase"), backgroundColor: Colors.deepPurple, foregroundColor: Colors.white),
      body: _load? const Center(child: CircularProgressIndicator()) :
      _files.isEmpty? const Center(child: Text("No books yet.\nUpload PDFs to Firebase Storage > ebooks folder", textAlign: TextAlign.center)) :
      ListView.builder(itemCount: _files.length, itemBuilder: (c, i) {
        return ListTile(leading: const Icon(Icons.picture_as_pdf, color: Colors.red), title: Text(_files[i].name), subtitle: const Text("Tap to read"),
          onTap: () async { var url = await _files[i].getDownloadURL(); launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication); },
        );
      }),
    );
  }
}

// COMMUNITY TAB - REAL CHAT B VERSION
class CommunityTabB extends StatefulWidget {
  const CommunityTabB({super.key});
  @override
  State<CommunityTabB> createState() => _CommunityTabBState();
}
class _CommunityTabBState extends State<CommunityTabB> {
  final _controller = TextEditingController();
  final _auth = FirebaseAuth.instance;
  final _firestore = FirebaseFirestore.instance;
  String _type = "prayer";

  Future<void> _send() async {
    if (_controller.text.trim().isEmpty) return;
    await _firestore.collection('community_messages').add({
      'userName': _auth.currentUser!.isAnonymous? "Guest ${ _auth.currentUser!.uid.substring(0,4)}" : _auth.currentUser!.displayName?? "User",
      'message': _controller.text.trim(),
      'type': _type,
      'timestamp': FieldValue.serverTimestamp(),
      'likes': 0,
      'userId': _auth.currentUser!.uid,
    });
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Overflow Family Chat"), backgroundColor: Colors.deepPurple, foregroundColor: Colors.white,
        actions: [DropdownButton<String>(value: _type, dropdownColor: Colors.deepPurple, style: const TextStyle(color: Colors.white), underline: const SizedBox(), items: const [DropdownMenuItem(value: "prayer", child: Text("🙏 Prayer")), DropdownMenuItem(value: "testimony", child: Text("✨ Testimony")), DropdownMenuItem(value: "chat", child: Text("💬 Chat"))], onChanged: (v) => setState(() => _type = v!))]),
      body: Column(children: [
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: _firestore.collection('community_messages').orderBy('timestamp', descending: true).limit(100).snapshots(),
            builder: (c, snap) {
              if (!snap.hasData) return const Center(child: CircularProgressIndicator());
              var docs = snap.data!.docs;
              return ListView.builder(reverse: true, itemCount: docs.length, itemBuilder: (ctx, i) {
                var d = docs[i].data() as Map<String, dynamic>;
                IconData icon = d['type'] == 'prayer'? Icons.favorite : d['type'] == 'testimony'? Icons.star : Icons.chat;
                return Card(margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), child: ListTile(
                  leading: Icon(icon, color: Colors.deepPurple),
                  title: Text(d['userName']?? 'User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: Text(d['message']?? ''),
                  trailing: IconButton(icon: const Icon(Icons.favorite_border), onPressed: () { _firestore.collection('community_messages').doc(docs[i].id).update({'likes': FieldValue.increment(1)}); }),
                ));
              });
            },
          ),
        ),
        Divider(height: 1),
        Padding(padding: const EdgeInsets.all(8), child: Row(children: [
          Expanded(child: TextField(controller: _controller, decoration: InputDecoration(hintText: "Share prayer, testimony...", border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)), contentPadding: const EdgeInsets.symmetric(horizontal: 15)), onSubmitted: (_) => _send())),
          const SizedBox(width: 8),
          CircleAvatar(backgroundColor: Colors.deepPurple, child: IconButton(icon: const Icon(Icons.send, color: Colors.white), onPressed: _send)),
        ])),
      ]),
    );
  }
}

class FormsTab extends StatelessWidget {
  const FormsTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text("Forms"), backgroundColor: Colors.deepPurple, foregroundColor: Colors.white), body: const Center(child: Text("Partnership Forms - Connected to Firestore")));
  }
}
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: const Text("Profile"), backgroundColor: Colors.deepPurple, foregroundColor: Colors.white), body: Center(child: Text("UID: ${FirebaseAuth.instance.currentUser?.uid?? 'loading...'}")));
  }
}