import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/async_state.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';
import '../lab/investigation_card.dart';

/// Lab & imaging requests for this visit — the mobile InvestigationForm.jsx.
class InvestigationsTab extends StatefulWidget {
  const InvestigationsTab({super.key, required this.visit});
  final Visit visit;

  @override
  State<InvestigationsTab> createState() => _InvestigationsTabState();
}

class _InvestigationsTabState extends State<InvestigationsTab>
    with AsyncLoad<InvestigationsTab, List<Investigation>>, AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Future<List<Investigation>> fetch() =>
      context.read<ClinicApi>().investigations(visitId: widget.visit.id);

  @override
  List<String> get refreshOn =>
      const ['investigation:created', 'investigation:result-added'];

  Future<void> _request() async {
    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _RequestSheet(visit: widget.visit),
    );
    if (added == true) reload(silent: true);
  }

  Future<void> _cancel(Investigation inv) async {
    final ok = await confirmAction(
      context,
      title: tr('mobile.investigation.cancelTitle'),
      message: tr('investigation.cancelConfirm'),
      confirmLabel: tr('mobile.investigation.cancelAction'),
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await context.read<ClinicApi>().updateInvestigation(inv.id, {'status': 'cancelled'});
      Toast.success(tr('investigation.cancelSuccess'));
      reload(silent: true);
    } catch (e) {
      Toast.error('${tr('investigation.cancelError')}: ${ApiException.from(e).message}');
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final list = data ?? const <Investigation>[];
    return RefreshIndicator(
      onRefresh: () => reload(silent: true),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          GradientButton(
            label: tr('investigation.requestButton'),
            icon: Icons.add_rounded,
            onPressed: _request,
            height: 48,
          ),
          const SizedBox(height: 14),
          if (loading && data == null)
            const LoadingView()
          else if (error != null && data == null)
            ErrorView(message: error!, onRetry: reload)
          else if (list.isEmpty)
            EmptyView(
              icon: Icons.biotech_outlined,
              title: tr('investigation.emptyList'),
            )
          else
            for (final inv in list)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InvestigationCard(
                  investigation: inv,
                  actions: [
                    if (inv.status == 'requested')
                      OutlinedButton.icon(
                        icon: const Icon(Icons.close_rounded, size: 18),
                        label: Text(tr('mobile.investigation.cancelAction')),
                        onPressed: () => _cancel(inv),
                      ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

class _RequestSheet extends StatefulWidget {
  const _RequestSheet({required this.visit});
  final Visit visit;

  @override
  State<_RequestSheet> createState() => _RequestSheetState();
}

class _RequestSheetState extends State<_RequestSheet> {
  final _form = GlobalKey<FormState>();
  final _testName = TextEditingController();
  final _instructions = TextEditingController();
  String? _type;
  String _urgency = 'routine';
  DateTime? _scheduled;
  bool _saving = false;

  @override
  void dispose() {
    _testName.dispose();
    _instructions.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final user = context.read<AuthController>().user;
    final v = widget.visit;
    setState(() => _saving = true);
    try {
      await context.read<ClinicApi>().requestInvestigation({
        'visitId': v.id,
        'patientId': v.patient?.id ?? asPatientId(v),
        'requestedBy': user?.id,
        'investigationType': _type,
        'testName': _testName.text.trim(),
        'instructions': _instructions.text.trim(),
        'urgency': _urgency,
        'scheduledDate': _scheduled?.toIso8601String(),
        'requestedDate': DateTime.now().toUtc().toIso8601String(),
        'status': 'requested',
      });
      Toast.success(tr('investigation.requestSuccess'));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error('${tr('investigation.requestError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(tr('investigation.requestButton'), style: context.text.titleLarge),
              const SizedBox(height: 16),
              DropdownRow<String>(
                label: trl('investigation.typeLabel'),
                value: _type,
                hint: tr('investigation.typePlaceholder'),
                items: [
                  for (final (value, key) in Investigation.types)
                    (value, tr('investigation.type.$key')),
                ],
                validator: (v) => v == null ? tr('investigation.fillError') : null,
                onChanged: (v) => setState(() => _type = v),
              ),
              TextFieldRow(
                label: trl('investigation.testNameLabel'),
                controller: _testName,
                hint: tr('investigation.testNamePlaceholder'),
                capitalization: TextCapitalization.words,
                validator: (v) => Validators.required(v, tr('investigation.fillError')),
              ),
              FieldLabel(
                tr('investigation.urgencyLabel'),
                child: Segmented<String>(
                  value: _urgency,
                  onChanged: (v) => setState(() => _urgency = v),
                  items: [
                    for (final u in Investigation.urgencies)
                      (u, tr('laboratory.urgency.$u'), switch (u) {
                        'stat' => Icons.bolt_rounded,
                        'urgent' => Icons.priority_high_rounded,
                        _ => Icons.schedule_rounded,
                      }),
                  ],
                ),
              ),
              DateFieldRow(
                label: tr('investigation.scheduledDateLabel'),
                value: _scheduled,
                firstDate: DateTime.now().subtract(const Duration(days: 1)),
                onChanged: (d) => setState(() => _scheduled = d),
              ),
              TextFieldRow(
                label: tr('investigation.instructionsLabel'),
                controller: _instructions,
                hint: tr('investigation.instructionsPlaceholder'),
                optional: true,
                minLines: 2,
                maxLines: 5,
                capitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 6),
              GradientButton(
                label: tr('investigation.requestButton'),
                icon: Icons.send_rounded,
                loading: _saving,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Visits from the queue embed the patient; fall back to the raw id.
String? asPatientId(Visit v) => v.raw['patientId']?.toString();
