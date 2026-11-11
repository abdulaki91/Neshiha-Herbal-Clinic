import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

import '../theme/app_theme.dart';

/// The leaf mark from the web sidebar/sign-in (components/portal/BrandMark).
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 44});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: Brand.markGradient,
        borderRadius: BorderRadius.circular(size * 0.32),
        border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF785AAA).withValues(alpha: 0.45),
            blurRadius: size * 0.5,
            offset: Offset(0, size * 0.2),
            spreadRadius: -size * 0.2,
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(size * 0.21),
        child: CustomPaint(painter: _LeafPainter()),
      ),
    );
  }
}

class _LeafPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;
    canvas.save();
    canvas.scale(s);
    final leaf = Path()
      ..moveTo(5, 19)
      ..cubicTo(5, 10.5, 10.5, 5, 19, 5)
      ..cubicTo(19, 13.5, 13.5, 19, 5, 19)
      ..close();
    canvas.drawPath(
        leaf, Paint()..color = Colors.white.withValues(alpha: 0.22));
    final stroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(leaf, stroke);
    canvas.drawLine(const Offset(5, 19), const Offset(14.5, 9.5), stroke);
    canvas.drawLine(const Offset(9.5, 14.5), const Offset(13, 14.5), stroke);
    canvas.drawLine(const Offset(9.5, 14.5), const Offset(9.5, 11), stroke);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Herb sprigs tucked into the hero's corner (DashboardHero.jsx `Sprigs`).
class Sprigs extends StatelessWidget {
  const Sprigs({super.key, this.size = 150, this.opacity = 0.8});
  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: Opacity(
          opacity: opacity,
          child: CustomPaint(size: Size.square(size), painter: _SprigPainter()),
        ),
      );
}

class _SprigPainter extends CustomPainter {
  static const _leaves = [
    [128.0, 128.0, -40.0], [118.0, 112.0, 150.0], [108.0, 98.0, -50.0],
    [100.0, 86.0, 140.0], [92.0, 76.0, -60.0], [86.0, 68.0, 130.0],
    [148.0, 116.0, -20.0], [140.0, 104.0, 170.0], [133.0, 92.0, -30.0],
    [126.0, 82.0, 160.0],
  ];

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 160);
    final stem = Paint()
      ..color = Brand.sage
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(
        Path()
          ..moveTo(150, 160)
          ..cubicTo(130, 120, 112, 92, 82, 64),
        stem);
    canvas.drawPath(
        Path()
          ..moveTo(160, 128)
          ..cubicTo(140, 112, 128, 98, 118, 72),
        stem);
    for (var i = 0; i < _leaves.length; i++) {
      final l = _leaves[i];
      canvas.save();
      canvas.translate(l[0], l[1]);
      canvas.rotate(l[2] * math.pi / 180);
      final sc = 1 - (i % 5) * 0.08;
      canvas.scale(sc);
      canvas.drawPath(
        Path()
          ..moveTo(0, 0)
          ..cubicTo(3, -5, 10, -6, 16, 0)
          ..cubicTo(10, 6, 3, 5, 0, 0)
          ..close(),
        Paint()..color = i % 3 == 0 ? Brand.sageLight : Brand.sage,
      );
      canvas.restore();
    }
    canvas.drawCircle(
        const Offset(84, 62), 2.4, Paint()..color = const Color(0xFFF6DC8F));
    canvas.drawCircle(
        const Offset(118, 70), 2, Paint()..color = const Color(0xFFF5CAD9));
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Animated progress ring for the dashboard hero (web: PulseRing).
class PulseRing extends StatelessWidget {
  const PulseRing({
    super.key,
    required this.percent,
    required this.caption,
    this.size = 132,
  });

  /// 0–100, or null when there's nothing to measure yet.
  final double? percent;
  final String caption;
  final double size;

  @override
  Widget build(BuildContext context) {
    final target = ((percent ?? 0) / 100).clamp(0.0, 1.0);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: target),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (context, v, _) => SizedBox.square(
        dimension: size,
        child: CustomPaint(
          painter: _RingPainter(v),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  percent == null ? '—' : '${(v * 100).round()}%',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: size * 0.24,
                    fontWeight: FontWeight.w300,
                    letterSpacing: -1,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 4),
                SizedBox(
                  width: size * 0.62,
                  child: Text(
                    caption,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value);
  final double value;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.085;
    final rect = Offset.zero & size;
    final arcRect = rect.deflate(stroke / 2 + 2);

    // Soft glow disc
    canvas.drawCircle(
      rect.center,
      size.width / 2 - stroke,
      Paint()..color = Colors.white.withValues(alpha: 0.06),
    );

    // Tick marks around the ring
    final tick = Paint()
      ..color = Colors.white.withValues(alpha: 0.18)
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    final r1 = size.width / 2 - stroke - 6;
    final r2 = r1 - 4;
    for (var i = 0; i < 60; i++) {
      final a = i * 2 * math.pi / 60;
      final c = rect.center;
      canvas.drawLine(
        c + Offset(math.cos(a) * r1, math.sin(a) * r1),
        c + Offset(math.cos(a) * r2, math.sin(a) * r2),
        tick,
      );
    }

    // Track
    canvas.drawArc(
      arcRect,
      0,
      2 * math.pi,
      false,
      Paint()
        ..color = Colors.white.withValues(alpha: 0.16)
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke,
    );

    if (value <= 0) return;
    final sweep = 2 * math.pi * value;
    final paint = Paint()
      ..shader = SweepGradient(
        startAngle: 0,
        endAngle: 2 * math.pi,
        colors: const [Color(0xFFFBD5E5), Colors.white, Color(0xFFFBD5E5)],
        transform: const GradientRotation(-math.pi / 2),
      ).createShader(arcRect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(arcRect, -math.pi / 2, sweep, false, paint);

    // End dot
    final end = -math.pi / 2 + sweep;
    final rr = arcRect.width / 2;
    canvas.drawCircle(
      rect.center + Offset(math.cos(end) * rr, math.sin(end) * rr),
      stroke * 0.32,
      Paint()..color = const Color(0xFF5F63AD),
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.value != value;
}
