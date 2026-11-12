import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../i18n/i18n.dart';
import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/backdrop.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';

/// Register a new patient (with the one-time registration fee) or edit an
/// existing one. Pops with the saved [Patient].
class PatientFormScreen extends StatefulWidget {
  const PatientFormScreen({super.key, this.patient, this.prefill});

  final Patient? patient;

  /// Values carried over from a website booking request.
  final Map<String, String>? prefill;

  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
  final _form = GlobalKey<FormState>();
  late final _first = TextEditingController(
      text: widget.patient?.firstName ?? widget.prefill?['firstName']);
  late final _last = TextEditingController(
      text: widget.patient?.lastName ?? widget.prefill?['lastName']);
  late final _age =
      TextEditingController(text: widget.patient?.age?.toString());
  late final _phone = TextEditingController(
      text: widget.patient?.phone ?? widget.prefill?['phone']);
  late final _city = TextEditingController(text: widget.patient?.city);
  late final _woreda = TextEditingController(text: widget.patient?.woreda);
  final _txn = TextEditingController();
  late String? _gender = widget.patient?.gender;
  String? _feeMethod;
  bool _saving = false;
  bool _showErrors = false;

  bool get _editing => widget.patient != null;

  @override
  void dispose() {
    for (final c in [_first, _last, _age, _phone, _city, _woreda, _txn]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() => _showErrors = true);
    final valid = _form.currentState!.validate();
    if (!valid || _gender == null || (!_editing && _feeMethod == null)) {
      Toast.error(tr('mobile.validation.fixFields'));
      return;
    }
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'firstName': _first.text.trim(),
      'lastName': _last.text.trim(),
      'gender': _gender,
      'age': int.parse(_age.text.trim()),
      'phone': _phone.text.trim(),
      'city': _city.text.trim(),
      'woreda': _woreda.text.trim(),
      if (!_editing) 'registrationFeeMethod': _feeMethod,
      if (!_editing && _txn.text.trim().isNotEmpty)
        'registrationFeeTransactionId': _txn.text.trim(),
    };
    try {
      final api = context.read<ClinicApi>();
      final saved = _editing
          ? await api.updatePatient(widget.patient!.id, payload)
          : await api.createPatient(payload);
      Toast.success(_editing ? tr('patientForm.updateSuccess') : tr('patientForm.registerSuccess'));
      if (mounted) Navigator.of(context).pop(saved);
    } catch (e) {
      Toast.error(ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String? _required(String? v, String label) =>
      (v ?? '').trim().isEmpty ? label : null;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    return BackdropScaffold(
      appBar: AppBar(
        title: Text(_editing ? tr('patientForm.editTitle') : tr('patientForm.registerTitle')),
      ),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
          children: [
            if (widget.prefill != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: p.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(Icons.inbox_rounded, color: p.warning, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        tr('patientForm.fromBookingNotice'),
                        style: TextStyle(color: p.warning, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            GlassCard(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SectionTitle(tr('patientForm.personalInfoTitle'),
                      icon: Icons.person_rounded),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: FieldLabel(trl('patientForm.firstNameLabel'),
                            child: TextFormField(
                              controller: _first,
                              textCapitalization: TextCapitalization.words,
                              textInputAction: TextInputAction.next,
                              validator: (v) => _required(v, tr('patientForm.firstNameRequired')),
                            )),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FieldLabel(trl('patientForm.lastNameLabel'),
                            child: TextFormField(
                              controller: _last,
                              textCapitalization: TextCapitalization.words,
                              textInputAction: TextInputAction.next,
                              validator: (v) => _required(v, tr('patientForm.lastNameRequired')),
                            )),
                      ),
                    ],
                  ),
                  FieldLabel(
                    trl('patientForm.genderLabel'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Segmented<String?>(
                          value: _gender,
                          onChanged: (v) => setState(() => _gender = v),
                          items: [
                            ('male', tr('patientForm.genderMale'), Icons.male_rounded),
                            ('female', tr('patientForm.genderFemale'), Icons.female_rounded),
                            ('other', tr('patientForm.genderOther'), null),
                          ],
                        ),
                        if (_showErrors && _gender == null)
                          Padding(
                            padding: const EdgeInsets.only(left: 12, top: 6),
                            child: Text(tr('patientForm.genderRequired'),
                                style: TextStyle(color: p.danger, fontSize: 12)),
                          ),
                      ],
                    ),
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 110,
                        child: FieldLabel(trl('patientForm.ageLabel'),
                            child: TextFormField(
                              controller: _age,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(3),
                              ],
                              textInputAction: TextInputAction.next,
                              decoration: const InputDecoration(suffixText: 'yrs'),
                              validator: (v) {
                                final n = int.tryParse(v ?? '');
                                if (n == null) return tr('patientForm.ageRequired');
                                if (n < 0 || n > 150) return tr('patientForm.ageInvalid');
                                return null;
                              },
                            )),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FieldLabel(trl('patientForm.phoneLabel'),
                            child: TextFormField(
                              controller: _phone,
                              keyboardType: TextInputType.phone,
                              textInputAction: TextInputAction.next,
                              decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.phone_rounded)),
                              validator: (v) => _required(v, tr('patientForm.phoneRequired')),
                            )),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SectionTitle(tr('patientForm.addressTitle'), icon: Icons.place_rounded),
                  Row(
                    children: [
                      Expanded(
                        child: FieldLabel(tr('patientForm.cityLabel'),
                            optional: true,
                            child: TextFormField(
                              controller: _city,
                              textCapitalization: TextCapitalization.words,
                              textInputAction: TextInputAction.next,
                            )),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FieldLabel(tr('patientForm.woredaLabel'),
                            optional: true,
                            child: TextFormField(
                              controller: _woreda,
                              textCapitalization: TextCapitalization.words,
                            )),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (!_editing) ...[
              const SizedBox(height: 14),
              GlassCard(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionTitle(tr('patientForm.registrationFeeTitle'),
                        icon: Icons.receipt_long_rounded),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [
                          Brand.b500.withValues(alpha: p.isDark ? 0.25 : 0.12),
                          Brand.a400.withValues(alpha: p.isDark ? 0.2 : 0.1),
                        ]),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(tr('mobile.patient.feeHint'),
                                style: context.text.bodyMedium),
                          ),
                          Text('${AppConfig.registrationFee} ${AppConfig.currency}',
                              style: context.text.titleLarge),
                        ],
                      ),
                    ),
                    FieldLabel(
                      trl('patientForm.registrationFeeMethodLabel'),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final (v, l, i) in [
                                ('cash', tr('patientForm.registrationFeeMethodCash'), Icons.payments_rounded),
                                ('transfer', tr('patientForm.registrationFeeMethodTransfer'), Icons.account_balance_rounded),
                                ('telebirr', tr('patientForm.registrationFeeMethodTelebirr'), Icons.phone_iphone_rounded),
                              ])
                                ChoicePill(
                                  label: l,
                                  icon: i,
                                  selected: _feeMethod == v,
                                  onTap: () => setState(() => _feeMethod = v),
                                ),
                            ],
                          ),
                          if (_showErrors && _feeMethod == null)
                            Padding(
                              padding: const EdgeInsets.only(left: 12, top: 6),
                              child: Text(tr('patientForm.registrationFeeMethodRequired'),
                                  style: TextStyle(color: p.danger, fontSize: 12)),
                            ),
                        ],
                      ),
                    ),
                    if (_feeMethod != null && _feeMethod != 'cash')
                      FieldLabel(tr('mobile.common.transactionId'),
                          optional: true,
                          child: TextFormField(controller: _txn)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      bottomBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        child: GradientButton(
          label: _editing ? tr('patientForm.updateButton') : tr('patientForm.registerButton'),
          icon: _editing ? Icons.check_rounded : Icons.person_add_alt_1_rounded,
          loading: _saving,
          onPressed: _save,
        ),
      ),
    );
  }
}
