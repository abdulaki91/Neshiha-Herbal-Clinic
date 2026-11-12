import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';

/// Clinic configuration (super admin) — the mobile SettingsPage.jsx.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const _days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', //
  ];
  static const _text = [
    'clinicName', 'clinicPhone', 'clinicEmail', 'clinicAddress', 'currency', //
    'whatsappNumber', 'facebookUrl', 'instagramUrl', 'tiktokUrl', 'twitterUrl',
    'googleMapsEmbedUrl', 'timezone', 'termsAndConditions', 'privacyPolicy',
  ];
  static const _numbers = [
    'yearsExperience', 'patientsServed', 'treatmentsOffered', //
    'appointmentDuration', 'lowStockThreshold',
  ];
  static const _localized = ['tagline', 'mission', 'vision', 'aboutText'];

  final _form = GlobalKey<FormState>();
  final _c = <String, TextEditingController>{};
  final _loc = <String, Map<String, TextEditingController>>{};
  ClinicSettings? _settings;
  String? _error;
  bool _saving = false;
  bool _uploading = false;
  String? _opens;
  String? _closes;
  String _dateFormat = 'YYYY-MM-DD';
  String _timeFormat = '24h';
  bool _email = false;
  bool _sms = false;
  Set<String> _workingDays = {};
  PickedUpload? _logo;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in _c.values) {
      c.dispose();
    }
    for (final m in _loc.values) {
      for (final c in m.values) {
        c.dispose();
      }
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final s = await context.read<ClinicApi>().settings();
      for (final k in _text) {
        _c[k] = TextEditingController(text: s.str(k));
      }
      for (final k in _numbers) {
        final v = s.integer(k);
        _c[k] = TextEditingController(text: v == null ? '' : '$v');
      }
      for (final k in _localized) {
        _loc[k] = TranslatableFieldRow.controllersFor(s.loc(k));
      }
      setState(() {
        _settings = s;
        _opens = s.str('workingHoursStart');
        _closes = s.str('workingHoursEnd');
        _dateFormat = s.str('dateFormat') ?? _dateFormat;
        _timeFormat = s.str('timeFormat') ?? _timeFormat;
        _email = s.flag('enableEmailNotifications');
        _sms = s.flag('enableSMSNotifications');
        _workingDays = s.workingDays.map((d) => d.toLowerCase()).toSet();
      });
    } catch (e) {
      setState(() => _error = '${tr('settings.loadError')}: ${ApiException.from(e).message}');
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    int? n(String k) => int.tryParse(_c[k]!.text.trim());
    final data = <String, dynamic>{
      for (final k in _text) k: _c[k]!.text.trim(),
      for (final k in _localized) k: TranslatableFieldRow.valueOf(_loc[k]!),
      'yearsExperience': n('yearsExperience'),
      'patientsServed': n('patientsServed'),
      'treatmentsOffered': n('treatmentsOffered'),
      'appointmentDuration': n('appointmentDuration') ?? 30,
      'lowStockThreshold': n('lowStockThreshold') ?? 10,
      'workingHoursStart': _opens,
      'workingHoursEnd': _closes,
      'workingDays': [for (final d in _days) if (_workingDays.contains(d)) d],
      'dateFormat': _dateFormat,
      'timeFormat': _timeFormat,
      'enableEmailNotifications': _email,
      'enableSMSNotifications': _sms,
    };
    final api = context.read<ClinicApi>();
    setState(() => _saving = true);
    try {
      if (_logo != null) {
        setState(() => _uploading = true);
        try {
          await api.uploadLogo(_logo!);
          Toast.success(tr('settings.business.logoUploadSuccess'));
          _logo = null;
        } catch (e) {
          Toast.error('${tr('settings.business.logoUploadError')}: ${ApiException.from(e).message}');
        } finally {
          if (mounted) setState(() => _uploading = false);
        }
      }
      final s = await api.updateSettings(data);
      if (mounted) setState(() => _settings = s.raw.isEmpty ? _settings : s);
      Toast.success(tr('settings.saveSuccess'));
    } catch (e) {
      Toast.error('${tr('settings.saveError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  TextFieldRow _field(String key, String label,
          {TextInputType? type, bool optional = true, int maxLines = 1, String? helper,
          String? Function(String?)? validator}) =>
      TextFieldRow(
        label: label,
        controller: _c[key]!,
        keyboardType: type,
        optional: optional,
        maxLines: maxLines,
        minLines: maxLines > 1 ? 3 : null,
        helper: helper,
        validator: validator,
      );

  @override
  Widget build(BuildContext context) {
    final canEdit = context.read<AuthController>().role == Roles.superAdmin;
    if (_settings == null) {
      return BackdropScaffold(
        appBar: AppBar(title: Text(tr('settings.title'))),
        body: _error == null ? const LoadingView() : ErrorView(message: _error!, onRetry: _load),
      );
    }
    return FormPage(
      title: tr('settings.title'),
      subtitle: tr('settings.subtitle'),
      formKey: _form,
      saving: _saving || _uploading,
      saveLabel: tr('settings.saveButton'),
      onSave: canEdit ? _save : null,
      children: [
        if (!canEdit)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(tr('settings.readOnlyNotice')),
          ),
        FormSection(
          icon: Icons.local_hospital_rounded,
          title: tr('settings.clinic.title'),
          subtitle: tr('settings.clinic.description'),
          children: [
            _field('clinicName', tr('settings.clinic.name'), optional: false,
                validator: (v) => Validators.required(v)),
            _field('clinicPhone', tr('settings.clinic.phone'), type: TextInputType.phone),
            _field('clinicEmail', tr('settings.clinic.email'),
                type: TextInputType.emailAddress,
                validator: (v) => Validators.email(v, optional: true) == null
                    ? null
                    : tr('settings.clinic.emailInvalid')),
            _field('currency', tr('settings.clinic.currency')),
            _field('clinicAddress', tr('settings.clinic.address'), maxLines: 4),
          ],
        ),
        FormSection(
          icon: Icons.storefront_rounded,
          title: tr('settings.business.title'),
          subtitle: tr('settings.business.description'),
          children: [
            ImagePickRow(
              label: tr('settings.business.logo'),
              buttonLabel: tr('settings.business.uploadLogo'),
              currentPath: _settings!.str('clinicLogo'),
              picked: _logo,
              onPicked: (f) => setState(() => _logo = f),
            ),
            TranslatableFieldRow(label: tr('settings.business.tagline'), controllers: _loc['tagline']!),
            TranslatableFieldRow(
                label: tr('settings.business.mission'), controllers: _loc['mission']!, multiline: true),
            TranslatableFieldRow(
                label: tr('settings.business.vision'), controllers: _loc['vision']!, multiline: true),
            TranslatableFieldRow(
                label: tr('settings.business.aboutText'), controllers: _loc['aboutText']!, multiline: true),
            for (final (k, label) in [
              ('yearsExperience', tr('settings.business.yearsExperience')),
              ('patientsServed', tr('settings.business.patientsServed')),
              ('treatmentsOffered', tr('settings.business.treatmentsOffered')),
            ])
              NumberFieldRow(label: label, controller: _c[k]!, validator: Validators.positiveNumber),
          ],
        ),
        FormSection(
          icon: Icons.share_rounded,
          title: tr('settings.contact.title'),
          subtitle: tr('settings.contact.description'),
          children: [
            _field('whatsappNumber', tr('settings.contact.whatsapp'), type: TextInputType.phone),
            _field('facebookUrl', tr('settings.contact.facebook'), type: TextInputType.url),
            _field('instagramUrl', tr('settings.contact.instagram'), type: TextInputType.url),
            _field('tiktokUrl', tr('settings.contact.tiktok'), type: TextInputType.url),
            _field('twitterUrl', tr('settings.contact.twitter'), type: TextInputType.url),
            _field('googleMapsEmbedUrl', tr('settings.contact.googleMaps'),
                type: TextInputType.url, helper: tr('settings.contact.googleMapsHint')),
          ],
        ),
        FormSection(
          icon: Icons.schedule_rounded,
          title: tr('settings.schedule.title'),
          subtitle: tr('settings.schedule.description'),
          children: [
            Row(
              children: [
                Expanded(
                  child: TimeFieldRow(
                    label: tr('settings.schedule.opensAt'),
                    value: _opens,
                    onChanged: (v) => setState(() => _opens = v),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TimeFieldRow(
                    label: tr('settings.schedule.closesAt'),
                    value: _closes,
                    onChanged: (v) => setState(() => _closes = v),
                  ),
                ),
              ],
            ),
            _field('timezone', tr('settings.schedule.timezone')),
            NumberFieldRow(
              label: tr('settings.schedule.appointmentDuration'),
              controller: _c['appointmentDuration']!,
              helper: tr('settings.schedule.minutesHint'),
              validator: Validators.positiveNumber,
            ),
            FieldLabel(
              tr('settings.schedule.workingDays'),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final d in _days)
                    ChoicePill(
                      label: tr('settings.weekdays.$d'),
                      selected: _workingDays.contains(d),
                      onTap: () => setState(() =>
                          _workingDays.contains(d) ? _workingDays.remove(d) : _workingDays.add(d)),
                    ),
                ],
              ),
            ),
          ],
        ),
        FormSection(
          icon: Icons.tune_rounded,
          title: tr('settings.operations.title'),
          subtitle: tr('settings.operations.description'),
          children: [
            NumberFieldRow(
              label: tr('settings.operations.lowStockThreshold'),
              controller: _c['lowStockThreshold']!,
              helper: tr('settings.operations.lowStockHint'),
              validator: Validators.positiveNumber,
            ),
            DropdownRow<String>(
              label: tr('settings.operations.dateFormat'),
              value: _dateFormat,
              items: const [
                ('YYYY-MM-DD', 'YYYY-MM-DD'),
                ('DD/MM/YYYY', 'DD/MM/YYYY'),
                ('MM/DD/YYYY', 'MM/DD/YYYY'),
              ],
              onChanged: (v) => setState(() => _dateFormat = v ?? _dateFormat),
            ),
            DropdownRow<String>(
              label: tr('settings.operations.timeFormat'),
              value: _timeFormat,
              items: [
                ('24h', tr('settings.operations.hour24')),
                ('12h', tr('settings.operations.hour12')),
              ],
              onChanged: (v) => setState(() => _timeFormat = v ?? _timeFormat),
            ),
            SwitchRow(
              label: tr('settings.operations.emailNotifications'),
              value: _email,
              onChanged: (v) => setState(() => _email = v),
            ),
            SwitchRow(
              label: tr('settings.operations.smsNotifications'),
              value: _sms,
              onChanged: (v) => setState(() => _sms = v),
            ),
          ],
        ),
        FormSection(
          icon: Icons.gavel_rounded,
          title: tr('settings.legal.title'),
          subtitle: tr('settings.legal.description'),
          children: [
            _field('termsAndConditions', tr('settings.legal.terms'), maxLines: 10),
            _field('privacyPolicy', tr('settings.legal.privacy'), maxLines: 10),
          ],
        ),
      ],
    );
  }
}
