import 'dart:async';

import 'package:dio/dio.dart';

import '../i18n/i18n.dart';

import 'config.dart';
import 'json.dart';
import 'session_storage.dart';

/// Every endpoint answers with `{success, message, data, pagination?}`
/// (api/src/utils/response.js). This is that envelope.
class ApiResult {
  ApiResult(this.body);

  final Map<String, dynamic> body;

  dynamic get data => body['data'];
  String? get message => asString(body['message']);
  Pagination? get pagination {
    final p = asMap(body['pagination']) ?? asMap(asMap(data)?['pagination']);
    return p == null ? null : Pagination.fromJson(p);
  }

  List<Map<String, dynamic>> get list => asMapList(data);
  Map<String, dynamic> get map => asMap(data) ?? const {};
}

class Pagination {
  Pagination({
    required this.page,
    required this.pageSize,
    required this.totalItems,
    required this.totalPages,
  });

  factory Pagination.fromJson(Map<String, dynamic> j) {
    final page = asInt(j['page']) ?? 1;
    final pageSize = asInt(j['pageSize']) ?? 10;
    final total = asInt(j['totalItems']) ?? 0;
    final pages =
        asInt(j['totalPages']) ?? (pageSize > 0 ? (total / pageSize).ceil() : 1);
    return Pagination(
      page: page,
      pageSize: pageSize,
      totalItems: total,
      totalPages: pages,
    );
  }

  final int page;
  final int pageSize;
  final int totalItems;
  final int totalPages;

  bool get hasNext => page < totalPages;
}

/// A single error type for screens to show: the server's own message when
/// it sent one, otherwise a friendly fallback.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;

  static ApiException from(Object error) {
    if (error is ApiException) return error;
    if (error is DioException) {
      final res = error.response;
      final body = res?.data;
      if (body is Map) {
        final errors = body['errors'];
        if (errors is List && errors.isNotEmpty) {
          final first = errors.first;
          final msg = first is Map ? (first['msg'] ?? first['message']) : first;
          if (msg != null) {
            return ApiException(msg.toString(), statusCode: res?.statusCode);
          }
        }
        final msg = asString(body['message']);
        if (msg != null) return ApiException(msg, statusCode: res?.statusCode);
      }
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return ApiException(tr('mobile.errors.timeout'));
        case DioExceptionType.connectionError:
          return ApiException(
              tr('mobile.errors.offline'));
        default:
          break;
      }
      if (res?.statusCode == 403) {
        return ApiException(tr('mobile.errors.forbidden'),
            statusCode: 403);
      }
      return ApiException(tr('mobile.errors.generic'),
          statusCode: res?.statusCode);
    }
    return ApiException(tr('mobile.errors.generic'));
  }
}

class ApiClient {
  ApiClient(this._session) {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _session.accessToken;
        if (token != null && options.headers['Authorization'] == null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: _onError,
    ));
  }

  final SessionStorage _session;
  late final Dio _dio;

  /// Called when the refresh token is rejected — the app signs out.
  void Function()? onSessionExpired;

  Future<String?>? _refreshing;

  Future<void> _onError(
      DioException err, ErrorInterceptorHandler handler) async {
    final req = err.requestOptions;
    final isAuthCall = req.path.startsWith('/auth/login') ||
        req.path.startsWith('/auth/refresh');
    if (err.response?.statusCode != 401 ||
        isAuthCall ||
        req.extra['retried'] == true ||
        _session.refreshToken == null) {
      return handler.next(err);
    }

    // Single-flight: concurrent 401s share one refresh request.
    _refreshing ??= _refreshAccessToken().whenComplete(() => _refreshing = null);
    final newToken = await _refreshing;
    if (newToken == null) {
      onSessionExpired?.call();
      return handler.next(err);
    }

    try {
      req.headers['Authorization'] = 'Bearer $newToken';
      req.extra['retried'] = true;
      final retry = await _dio.fetch<dynamic>(req);
      handler.resolve(retry);
    } on DioException catch (e) {
      handler.next(e);
    }
  }

  /// The access token currently in use (null when signed out).
  String? get accessToken => _session.accessToken;

  /// Exchange the refresh token for a new access token, sharing one
  /// in-flight request with any concurrent HTTP 401 retries. Used by the
  /// socket when the server rejects its handshake token.
  Future<String?> refreshAccessToken() {
    if (_session.refreshToken == null) return Future.value(null);
    return _refreshing ??=
        _refreshAccessToken().whenComplete(() => _refreshing = null);
  }

  Future<String?> _refreshAccessToken() async {
    try {
      final res = await Dio(BaseOptions(baseUrl: AppConfig.apiUrl)).post(
        '/auth/refresh',
        data: {'refreshToken': _session.refreshToken},
      );
      final body = asMap(res.data);
      final token = asString(asMap(body?['data'])?['accessToken']);
      if (token == null) return null;
      await _session.saveTokens(access: token);
      return token;
    } catch (_) {
      return null;
    }
  }

  Future<ApiResult> _send(Future<Response<dynamic>> Function() call) async {
    try {
      final res = await call();
      final body = res.data;
      if (body is Map) return ApiResult(Map<String, dynamic>.from(body));
      return ApiResult({'data': body});
    } catch (e) {
      throw ApiException.from(e);
    }
  }

  Map<String, dynamic>? _clean(Map<String, dynamic>? q) {
    if (q == null) return null;
    return Map.fromEntries(q.entries.where(
        (e) => e.value != null && !(e.value is String && e.value == '')));
  }

  Future<ApiResult> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: _clean(query)));

  Future<ApiResult> post(String path, {Object? data}) =>
      _send(() => _dio.post(path, data: data));

  Future<ApiResult> put(String path, {Object? data}) =>
      _send(() => _dio.put(path, data: data));

  Future<ApiResult> patch(String path, {Object? data}) =>
      _send(() => _dio.patch(path, data: data));

  Future<ApiResult> delete(String path, {Object? data}) =>
      _send(() => _dio.delete(path, data: data));
}
