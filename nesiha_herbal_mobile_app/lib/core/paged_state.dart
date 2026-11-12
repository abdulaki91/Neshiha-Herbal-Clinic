import 'dart:async';

import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../data/clinic_api.dart';
import '../widgets/feedback.dart';
import 'api_client.dart';
import 'socket_service.dart';

/// Infinite-scroll list state: first page on init, next page near the end,
/// pull-to-refresh, and silent refresh on socket events.
mixin PagedLoad<W extends StatefulWidget, T> on State<W> {
  final items = <T>[];
  int _page = 0;
  bool hasNext = true;
  bool loading = true;
  bool loadingMore = false;
  String? error;
  int _generation = 0;
  StreamSubscription<SocketEvent>? _socketSub;

  Future<Paged<T>> fetchPage(int page);
  List<String> get refreshOn => const [];

  @override
  void initState() {
    super.initState();
    refresh(showSpinner: true);
    if (refreshOn.isNotEmpty) {
      _socketSub =
          context.read<SocketService>().on(refreshOn, (_) => refresh());
    }
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }

  /// Reload from page 1 (e.g. after a filter change or pull-to-refresh).
  Future<void> refresh({bool showSpinner = false}) async {
    final gen = ++_generation;
    if (showSpinner) {
      setState(() {
        loading = true;
        error = null;
      });
    }
    try {
      final res = await fetchPage(1);
      if (!mounted || gen != _generation) return;
      setState(() {
        items
          ..clear()
          ..addAll(res.items);
        _page = 1;
        hasNext = res.hasNext;
        loading = false;
        error = null;
      });
    } catch (e) {
      if (!mounted || gen != _generation) return;
      setState(() {
        loading = false;
        if (items.isEmpty) error = ApiException.from(e).message;
      });
    }
  }

  Future<void> loadMore() async {
    if (loadingMore || !hasNext || loading) return;
    final gen = _generation;
    setState(() => loadingMore = true);
    try {
      final res = await fetchPage(_page + 1);
      if (!mounted || gen != _generation) return;
      setState(() {
        items.addAll(res.items);
        _page += 1;
        hasNext = res.hasNext;
      });
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => loadingMore = false);
    }
  }

  /// Wraps a list: spinner / error / empty / items, with paging + refresh.
  Widget buildPaged({
    required Widget Function(BuildContext, T) itemBuilder,
    required Widget empty,
    required EdgeInsets padding,
    double spacing = 10,
  }) {
    if (loading && items.isEmpty) return const LoadingView();
    if (error != null && items.isEmpty) {
      return ErrorView(message: error!, onRetry: () => refresh(showSpinner: true));
    }
    return RefreshIndicator(
      onRefresh: refresh,
      child: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n.metrics.pixels > n.metrics.maxScrollExtent - 400) loadMore();
          return false;
        },
        child: items.isEmpty
            ? ListView(padding: padding, children: [empty])
            : ListView.separated(
                padding: padding,
                itemCount: items.length + (hasNext ? 1 : 0),
                separatorBuilder: (_, _) => SizedBox(height: spacing),
                itemBuilder: (context, i) {
                  if (i >= items.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: SizedBox.square(
                            dimension: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.4)),
                      ),
                    );
                  }
                  return itemBuilder(context, items[i]);
                },
              ),
      ),
    );
  }
}
