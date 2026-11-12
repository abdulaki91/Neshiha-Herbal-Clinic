import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';

/// Create or edit a staff account — the mobile StaffForm.jsx. The password
/// is only set at creation; afterwards it changes via "Reset password".
class StaffFormScreen extends StatefulWidget {
  const StaffFormScreen({super.key, this.staff});
  final AppUser? staff;

  @override
  State<StaffFormScreen> createState() => _StaffFormScreenState();
}

class _StaffFormScreenState extends State<StaffFormScreen> {
  final _form = GlobalKey<FormState>();
  late final AppUser? s = widget.staff;
  late final _first = TextEditingController(text: s?.firstName);
  late final _last = TextEditingController(text: s?.lastName);
  late final _email = TextEditingController(text: s?.email);
  late final _phone = TextEditingController(text: s?.phone);
  final _password = TextEditingController();
  late final _department = TextEditingController(text: s?.department);
  late final _specialization = TextEditingController(text: s?.specialization);
  late final _license = TextEditingController(text: s?.licenseNumber);
  late final _address = TextEditingController(text: s?.address);
  late String _role = s?.role ?? Roles.dataClerk;
  late String _status = s?.status ?? 'active';
  bool _saving = false;
  bool _showPassword = false;

  @override
  void dispose() {
    for (final c in [
      _first, _last, _email, _phone, _password, //
      _department, _specialization, _license, _address,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final data = <String, dynamic>{
      'firstName': _first.text.trim(),
      'lastName': _last.text.trim(),
      'email': _email.text.trim(),
      'phone': _phone.text.trim(),
      'role': _role,
      'status': _status,
      'department': textOrNull(_department),
      'specialization': textOrNull(_specialization),
      'licenseNumber': textOrNull(_license),
      'address': textOrNull(_address),
      if (s == null) 'password': _password.text,
    }..removeWhere((_, v) => v == null);

    final api = context.read<ClinicApi>();
    setState(() => _saving = true);
    try {
      if (s == null) {
        await api.createStaff(data);
        Toast.success(tr('staffForm.createSuccess'));
      } else {
        await api.updateStaff(s!.id, data);
        Toast.success(tr('staffForm.updateSuccess'));
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error('${tr('staffForm.saveError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Only a super admin may grant the super admin role (StaffForm.jsx).
    final me = context.read<AuthController>().role;
    final roles = me == Roles.superAdmin
        ? Roles.all
        : Roles.all.where((r) => r != Roles.superAdmin).toList();
    return FormPage(
      title: s == null ? tr('staffForm.addTitle') : tr('staffForm.editTitle'),
      subtitle: tr('staffForm.subtitle'),
      formKey: _form,
      saving: _saving,
      saveLabel: s == null ? tr('staffForm.createButton') : tr('staffForm.updateButton'),
      onSave: _save,
      children: [
        FormSection(
          icon: Icons.person_rounded,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TextFieldRow(
                    label: tr('staffForm.firstNameLabel'),
                    controller: _first,
                    capitalization: TextCapitalization.words,
                    validator: (v) => Validators.required(v, tr('staffForm.firstNameRequired')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFieldRow(
                    label: tr('staffForm.lastNameLabel'),
                    controller: _last,
                    capitalization: TextCapitalization.words,
                    validator: (v) => Validators.required(v, tr('staffForm.lastNameRequired')),
                  ),
                ),
              ],
            ),
            TextFieldRow(
              label: tr('staffForm.emailLabel'),
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              validator: Validators.email,
            ),
            TextFieldRow(
              label: tr('staffForm.phoneLabel'),
              controller: _phone,
              hint: tr('staffForm.phonePlaceholder'),
              keyboardType: TextInputType.phone,
              validator: (v) => Validators.required(v, tr('staffForm.phoneRequired')),
            ),
            if (s == null)
              FieldLabel(
                tr('staffForm.passwordLabel'),
                child: TextFormField(
                  controller: _password,
                  obscureText: !_showPassword,
                  validator: Validators.password,
                  decoration: InputDecoration(
                    helperText: tr('staffForm.passwordHint'),
                    helperMaxLines: 2,
                    suffixIcon: IconButton(
                      icon: Icon(_showPassword
                          ? Icons.visibility_off_rounded
                          : Icons.visibility_rounded),
                      onPressed: () => setState(() => _showPassword = !_showPassword),
                    ),
                  ),
                ),
              ),
          ],
        ),
        FormSection(
          icon: Icons.admin_panel_settings_rounded,
          children: [
            DropdownRow<String>(
              label: tr('staffForm.roleLabel'),
              value: _role,
              items: [for (final r in roles) (r, Roles.label(r))],
              onChanged: (v) => setState(() => _role = v ?? _role),
            ),
            DropdownRow<String>(
              label: tr('staffForm.statusLabel'),
              value: _status,
              items: [
                for (final st in ['active', 'inactive', 'suspended'])
                  (st, AppUser.statusLabel(st)),
              ],
              onChanged: (v) => setState(() => _status = v ?? _status),
            ),
            TextFieldRow(
              label: tr('staffForm.departmentLabel'),
              controller: _department,
              optional: true,
              capitalization: TextCapitalization.words,
            ),
            if (_role == Roles.doctor) ...[
              TextFieldRow(
                label: tr('staffForm.specializationLabel'),
                controller: _specialization,
                hint: tr('staffForm.specializationPlaceholder'),
                optional: true,
              ),
              TextFieldRow(
                label: tr('staffForm.licenseNumberLabel'),
                controller: _license,
                optional: true,
              ),
            ],
            TextFieldRow(
              label: tr('staffForm.addressLabel'),
              controller: _address,
              optional: true,
              minLines: 2,
              maxLines: 4,
            ),
          ],
        ),
      ],
    );
  }
}

/// "Reset password" for another staff member (signs them out everywhere).
Future<void> showResetPasswordSheet(BuildContext context, AppUser user) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _ResetPasswordSheet(user: user),
    );

class _ResetPasswordSheet extends StatefulWidget {
  const _ResetPasswordSheet({required this.user});
  final AppUser user;

  @override
  State<_ResetPasswordSheet> createState() => _ResetPasswordSheetState();
}

class _ResetPasswordSheetState extends State<_ResetPasswordSheet> {
  final _form = GlobalKey<FormState>();
  final _pw = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _pw.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await context.read<ClinicApi>().resetStaffPassword(widget.user.id, _pw.text);
      Toast.success(tr('staff.resetPassword.success'));
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      Toast.error('${tr('staff.resetPassword.error')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(tr('staff.resetPassword.title'), style: theme.textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(widget.user.fullName, style: theme.textTheme.bodySmall),
              const SizedBox(height: 12),
              Text(tr('staff.resetPassword.warning'),
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
              const SizedBox(height: 16),
              TextFieldRow(
                label: tr('staff.resetPassword.newPassword'),
                controller: _pw,
                obscure: true,
                helper: tr('staffForm.passwordHint'),
                validator: Validators.password,
              ),
              TextFieldRow(
                label: tr('staff.resetPassword.confirmPassword'),
                controller: _confirm,
                obscure: true,
                validator: (v) => v != _pw.text ? tr('staff.resetPassword.mismatch') : null,
              ),
              FilledButton.icon(
                icon: _saving
                    ? const SizedBox.square(
                        dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.lock_reset_rounded),
                label: Text(tr('staff.resetPassword.submit')),
                onPressed: _saving ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
