import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';

/// Vital signs for the visit — the mobile VitalSignsForm.jsx. Values are
/// stored on the visit row; BMI is calculated from weight and height.
class VitalsTab extends StatefulWidget {
  const VitalsTab({super.key, required this.visitId});
  final String visitId;

  @override
  State<VitalsTab> createState() => _VitalsTabState();
}

class _VitalsTabState extends State<VitalsTab> with AutomaticKeepAliveClientMixin {
  final _temp = TextEditingController();
  final _sys = TextEditingController();
  final _dia = TextEditingController();
  final _hr = TextEditingController();
  final _rr = TextEditingController();
  final _spo2 = TextEditingController();
  final _weight = TextEditingController();
  final _height = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _error;

  List<TextEditingController> get _all =>
      [_temp, _sys, _dia, _hr, _rr, _spo2, _weight, _height];

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    for (final c in _all) {
      c.addListener(() => setState(() {}));
    }
    _load();
  }

  @override
  void dispose() {
    for (final c in _all) {
      c.dispose();
    }
    super.dispose();
  }

  String _fmt(num? v) {
    if (v == null) return '';
    return v == v.roundToDouble() ? v.toInt().toString() : v.toString();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final v = await context.read<ClinicApi>().visit(widget.visitId);
      _temp.text = _fmt(v.temperature);
      _sys.text = _fmt(v.bloodPressureSystolic);
      _dia.text = _fmt(v.bloodPressureDiastolic);
      _hr.text = _fmt(v.heartRate);
      _rr.text = _fmt(v.respiratoryRate);
      _spo2.text = _fmt(v.oxygenSaturation);
      _weight.text = _fmt(v.weight);
      _height.text = _fmt(v.height);
    } catch (e) {
      _error = ApiException.from(e).message;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double? get _bmi {
    final w = double.tryParse(_weight.text.trim());
    final h = double.tryParse(_height.text.trim());
    if (w == null || h == null || h <= 0) return null;
    final m = h / 100;
    return double.parse((w / (m * m)).toStringAsFixed(2));
  }

  (String, Tone) _bmiCategory(double bmi) {
    if (bmi < 18.5) return (tr('bmi.category.underweight'), Tone.info);
    if (bmi < 25) return (tr('bmi.category.normal'), Tone.success);
    if (bmi < 30) return (tr('bmi.category.overweight'), Tone.warning);
    return (tr('bmi.category.obese'), Tone.danger);
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    double? d(TextEditingController c) => double.tryParse(c.text.trim());
    int? i(TextEditingController c) => int.tryParse(c.text.trim());
    setState(() => _saving = true);
    try {
      await context.read<ClinicApi>().saveVitals(widget.visitId, {
        'temperature': d(_temp),
        'bloodPressureSystolic': i(_sys),
        'bloodPressureDiastolic': i(_dia),
        'heartRate': i(_hr),
        'respiratoryRate': i(_rr),
        'oxygenSaturation': d(_spo2),
        'weight': d(_weight),
        'height': d(_height),
        'bmi': _bmi,
      });
      Toast.success(tr('vitalSigns.saveSuccess'));
    } catch (e) {
      Toast.error('${tr('vitalSigns.saveError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  /// Out-of-range readings get a warning colour (ranges from the web's
  /// reference card).
  Tone? _flag(TextEditingController c, double low, double high) {
    final v = double.tryParse(c.text.trim());
    if (v == null) return null;
    return v < low || v > high ? Tone.warning : Tone.success;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) return const LoadingView();
    if (_error != null) return ErrorView(message: _error!, onRetry: _load);
    final bmi = _bmi;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
      children: [
        GlassCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(Icons.monitor_heart_rounded,
                      color: Theme.of(context).colorScheme.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text(tr('vitalSigns.title'), style: context.text.titleSmall)),
                ],
              ),
              const SizedBox(height: 14),
              _VitalField(
                label: tr('vitalSigns.temperatureLabel'),
                controller: _temp,
                hint: tr('vitalSigns.temperaturePlaceholder'),
                decimal: true,
                flag: _flag(_temp, 36.5, 37.5),
                normal: tr('vitalSigns.temperatureNormal'),
              ),
              FieldLabel(
                tr('vitalSigns.bloodPressureLabel'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _sys,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                                hintText: tr('vitalSigns.systolicPlaceholder')),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 10),
                          child: Text('/', style: TextStyle(fontSize: 22)),
                        ),
                        Expanded(
                          child: TextField(
                            controller: _dia,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                                hintText: tr('vitalSigns.diastolicPlaceholder')),
                          ),
                        ),
                      ],
                    ),
                    _NormalHint(
                      text: tr('vitalSigns.bloodPressureNormal'),
                      tone: _bpFlag(),
                    ),
                  ],
                ),
              ),
              _VitalField(
                label: tr('vitalSigns.heartRateLabel'),
                controller: _hr,
                hint: tr('vitalSigns.heartRatePlaceholder'),
                flag: _flag(_hr, 60, 100),
                normal: tr('vitalSigns.heartRateNormal'),
              ),
              _VitalField(
                label: tr('vitalSigns.respiratoryRateLabel'),
                controller: _rr,
                hint: tr('vitalSigns.respiratoryRatePlaceholder'),
                flag: _flag(_rr, 12, 20),
                normal: tr('vitalSigns.respiratoryRateNormal'),
              ),
              _VitalField(
                label: tr('vitalSigns.oxygenSaturationLabel'),
                controller: _spo2,
                hint: tr('vitalSigns.oxygenSaturationPlaceholder'),
                decimal: true,
                flag: _flag(_spo2, 95, 100),
                normal: tr('vitalSigns.oxygenSaturationNormal'),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _VitalField(
                      label: tr('vitalSigns.weightLabel'),
                      controller: _weight,
                      hint: tr('vitalSigns.weightPlaceholder'),
                      decimal: true,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _VitalField(
                      label: tr('vitalSigns.heightLabel'),
                      controller: _height,
                      hint: tr('vitalSigns.heightPlaceholder'),
                      decimal: true,
                    ),
                  ),
                ],
              ),
              if (bmi != null) ...[
                _BmiCard(bmi: bmi, category: _bmiCategory(bmi)),
                const SizedBox(height: 16),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        GradientButton(
          label: tr('vitalSigns.saveButton'),
          icon: Icons.save_rounded,
          loading: _saving,
          onPressed: _save,
        ),
        const SizedBox(height: 14),
        _ReferenceCard(),
      ],
    );
  }

  Tone? _bpFlag() {
    final s = int.tryParse(_sys.text.trim());
    final d = int.tryParse(_dia.text.trim());
    if (s == null && d == null) return null;
    final bad = (s != null && (s < 90 || s > 139)) || (d != null && (d < 60 || d > 89));
    return bad ? Tone.warning : Tone.success;
  }
}

class _VitalField extends StatelessWidget {
  const _VitalField({
    required this.label,
    required this.controller,
    required this.hint,
    this.decimal = false,
    this.flag,
    this.normal,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final bool decimal;
  final Tone? flag;
  final String? normal;

  @override
  Widget build(BuildContext context) {
    return FieldLabel(
      label,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            keyboardType: TextInputType.numberWithOptions(decimal: decimal),
            decoration: InputDecoration(hintText: hint),
          ),
          if (normal != null) _NormalHint(text: normal!, tone: flag),
        ],
      ),
    );
  }
}

class _NormalHint extends StatelessWidget {
  const _NormalHint({required this.text, this.tone});
  final String text;
  final Tone? tone;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final c = tone?.color(p) ?? p.inkMuted;
    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 6, top: 6),
      child: Row(
        children: [
          if (tone != null) ...[
            Icon(tone == Tone.success ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                size: 14, color: c),
            const SizedBox(width: 4),
          ],
          Expanded(child: Text(text, style: context.text.bodySmall?.copyWith(color: c))),
        ],
      ),
    );
  }
}

class _BmiCard extends StatelessWidget {
  const _BmiCard({required this.bmi, required this.category});
  final double bmi;
  final (String, Tone) category;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final (label, tone) = category;
    final c = tone.color(p);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withValues(alpha: p.isDark ? 0.14 : 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('vitalSigns.bmiLabel'), style: context.text.labelMedium),
                const SizedBox(height: 4),
                Text(bmi.toStringAsFixed(1),
                    style: context.text.headlineSmall?.copyWith(color: c, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          StatusPill(label, tone: tone),
        ],
      ),
    );
  }
}

class _ReferenceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: p.info.withValues(alpha: p.isDark ? 0.12 : 0.07),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('vitalSigns.reference.title'),
              style: context.text.labelLarge?.copyWith(color: p.info)),
          const SizedBox(height: 6),
          for (final k in [
            'temperature',
            'bloodPressure',
            'heartRate',
            'respiratoryRate',
            'oxygenSaturation',
            'bmi',
          ])
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(tr('vitalSigns.reference.$k'), style: context.text.bodySmall),
            ),
        ],
      ),
    );
  }
}
