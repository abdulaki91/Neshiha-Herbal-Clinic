import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';

import 'api_client.dart';
import 'socket_service.dart';

/// Load-once-then-refresh state for a screen: [data], [error], [loading],
/// plus optional auto-refresh on socket events and on a timer.
mixin AsyncLoad<W extends StatefulWidget, T> on State<W> {
  T? data;
  String? error;
  bool loading = true;

  StreamSubscription<SocketEvent>? _socketSub;
  Timer? _pollTimer;
  int _generation = 0;

  Future<T> fetch();

  /// Socket events that should trigger a silent refresh.
  List<String> get refreshOn => const [];

  /// Safety-net polling interval (null = none).
  Duration? get pollEvery => null;

  @override
  void initState() {
    super.initState();
    reload();
    if (refreshOn.isNotEmpty) {
      _socketSub = context
          .read<SocketService>()
          .on(refreshOn, (_) => reload(silent: true));
    }
    final every = pollEvery;
    if (every != null) {
      _pollTimer = Timer.periodic(every, (_) => reload(silent: true));
    }
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> reload({bool silent = false}) async {
    final gen = ++_generation;
    if (!silent && mounted) {
      setState(() {
        loading = true;
        error = null;
      });
    }
    try {
      final result = await fetch();
      if (!mounted || gen != _generation) return;
      setState(() {
        data = result;
        error = null;
        loading = false;
      });
    } catch (e) {
      if (!mounted || gen != _generation) return;
      setState(() {
        // Keep showing stale data on a failed background refresh.
        if (!silent || data == null) error = ApiException.from(e).message;
        loading = false;
      });
    }
  }
}
