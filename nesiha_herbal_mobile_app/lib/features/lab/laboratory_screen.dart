import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/async_state.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../state/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';
import '../../widgets/tab_page.dart';
import 'investigation_card.dart';

/// Investigation requests and results — the mobile LaboratoryPage.jsx.
class LaboratoryScreen extends StatefulWidget {
  const LaboratoryScreen({super.key, this.pushed = true});
  final bool pushed;

  @override
  State<LaboratoryScreen> createState() => _LaboratoryScreenState();
}

class _LaboratoryScreenState extends State<LaboratoryScreen>
    with AsyncLoad<LaboratoryScreen, List<Investigation>> {
  String _status = 'requested';
  String _search = '';

  @override
  Future<List<Investigation>> fetch() =>
      context.read<ClinicApi>().investigations(status: _status);

  @override
  List<String> get refreshOn =>
      const ['investigation:created', 'investigation:result-added'];

  @override
  Duration? get pollEvery => const Duration(seconds: 60);

  List<Investigation> get _filtered {
    final term = _search.trim().toLowerCase();
    final all = data ?? const <Investigation>[];
    if (term.isEmpty) return all;
    return all.where((i) {
      final p = i.patient;
      return [
        p?.fullName ?? '',
        p?.patientId ?? '',
        i.testName,
        i.type,
      ].any((s) => s.toLowerCase().contains(term));
    }).toList();
  }

  bool get _isDoctor => context.read<AuthController>().role == Roles.doctor;

  Future<void> _start(Investigation inv) async {
    try {
      await context.read<ClinicApi>().updateInvestigation(inv.id, {'status': 'in_progress'});
      Toast.success(tr('laboratory.toast.statusUpdated',
          {'status': Investigation.statusLabel('in_progress')}));
      reload(silent: true);
    } catch (e) {
      Toast.error('${tr('laboratory.toast.statusUpdateError')}: ${ApiException.from(e).message}');
    }
  }

  Future<void> _enterResults(Investigation inv) async {
    final done = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ResultsEntryScreen(investigation: inv)),
    );
    if (done == true) reload(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    return TabPage(
      title: tr('laboratory.title'),
      subtitle: tr('laboratory.subtitle'),
      pushed: widget.pushed,
      header: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: SearchField(
              hint: tr('laboratory.search.placeholder'),
              debounce: const Duration(milliseconds: 150),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: FilterChips<String>(
              value: _status,
              items: [
                ('requested', tr('laboratory.status.requested')),
                ('in_progress', tr('laboratory.status.inProgress')),
                ('completed', tr('laboratory.status.completed')),
              ],
              onChanged: (v) {
                setState(() => _status = v);
                reload();
              },
            ),
          ),
        ],
      ),
      child: Builder(builder: (context) {
        if (loading && data == null) return const LoadingView();
        if (error != null && data == null) {
          return ErrorView(message: error!, onRetry: reload);
        }
        if (list.isEmpty) {
          return EmptyView(
            icon: Icons.biotech_outlined,
            title: _search.isNotEmpty
                ? tr('laboratory.empty.search')
                : tr('laboratory.empty.status',
                    {'status': Investigation.statusLabel(_status).toLowerCase()}),
          );
        }
        return RefreshIndicator(
          onRefresh: () => reload(silent: true),
          child: ListView.separated(
            padding: TabPage.listPadding(context, widget.pushed),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final inv = list[i];
              return InvestigationCard(
                investigation: inv,
                showPatient: true,
                actions: [
                  // Only doctors can update investigations (backend rule).
                  if (_isDoctor && inv.status == 'requested')
                    OutlinedButton.icon(
                      icon: const Icon(Icons.play_arrow_rounded, size: 18),
                      label: Text(tr('laboratory.actions.startProcessing')),
                      onPressed: () => _start(inv),
                    ),
                  if (_isDoctor && inv.isPending)
                    FilledButton.icon(
                      icon: const Icon(Icons.edit_note_rounded, size: 18),
                      label: Text(tr('laboratory.actions.enterResults')),
                      onPressed: () => _enterResults(inv),
                    ),
                ],
              );
            },
          ),
        );
      }),
    );
  }
}

/// The results form for one investigation.
class ResultsEntryScreen extends StatefulWidget {
  const ResultsEntryScreen({super.key, required this.investigation});
  final Investigation investigation;

  @override
  State<ResultsEntryScreen> createState() => _ResultsEntryScreenState();
}

class _ResultsEntryScreenState extends State<ResultsEntryScreen> {
  final _form = GlobalKey<FormState>();
  late final _results = TextEditingController(text: widget.investigation.results);
  late final _interpretation =
      TextEditingController(text: widget.investigation.interpretation);
  late final _performedBy = TextEditingController(text: widget.investigation.performedBy);
  late final _notes = TextEditingController(text: widget.investigation.notes);
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [_results, _interpretation, _performedBy, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final user = context.read<AuthController>().user;
    setState(() => _saving = true);
    try {
      await context.read<ClinicApi>().updateInvestigation(widget.investigation.id, {
        'results': _results.text.trim(),
        'interpretation': _interpretation.text.trim(),
        'performedBy': _performedBy.text.trim(),
        'notes': _notes.text.trim(),
        'status': 'completed',
        'completedDate': DateTime.now().toUtc().toIso8601String(),
        'reviewedBy': user?.id,
      });
      Toast.success(tr('laboratory.toast.submitSuccess'));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error('${tr('laboratory.toast.submitError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inv = widget.investigation;
    final p = context.palette;
    return FormPage(
      title: tr('laboratory.modal.title'),
      subtitle: '${inv.patient?.fullName ?? ''} · ${inv.testName}',
      formKey: _form,
      saveLabel: tr('laboratory.modal.submitResults'),
      saving: _saving,
      onSave: _submit,
      children: [
        FormSection(
          title: tr('laboratory.modal.investigationDetails'),
          icon: Icons.info_outline_rounded,
          children: [
            DetailLine(tr('laboratory.modal.type'), Investigation.typeLabel(inv.type)),
            DetailLine(tr('laboratory.modal.testName'), inv.testName),
            DetailLine(tr('laboratory.modal.urgency'), Investigation.urgencyLabel(inv.urgency)),
            DetailLine(tr('laboratory.modal.requestedDate'), Fmt.date(inv.requestedDate)),
            DetailLine(trl('laboratory.modal.instructions'), inv.instructions),
            if (inv.urgency == 'stat')
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(tr('pendingInvestigations.statAlert'),
                    style: context.text.labelMedium?.copyWith(color: p.danger)),
              ),
          ],
        ),
        FormSection(
          children: [
            TextFieldRow(
              label: trl('laboratory.modal.results'),
              controller: _results,
              hint: tr('laboratory.modal.resultsPlaceholder'),
              minLines: 5,
              maxLines: 12,
              capitalization: TextCapitalization.sentences,
              validator: (v) => Validators.required(v, tr('laboratory.toast.missingResults')),
            ),
            TextFieldRow(
              label: tr('laboratory.modal.interpretation'),
              controller: _interpretation,
              hint: tr('laboratory.modal.interpretationPlaceholder'),
              optional: true,
              minLines: 3,
              maxLines: 8,
              capitalization: TextCapitalization.sentences,
            ),
            TextFieldRow(
              label: trl('laboratory.modal.performedBy'),
              controller: _performedBy,
              hint: tr('laboratory.modal.performedByPlaceholder'),
              capitalization: TextCapitalization.words,
              validator: (v) =>
                  Validators.required(v, tr('laboratory.toast.missingPerformedBy')),
            ),
            TextFieldRow(
              label: tr('laboratory.modal.additionalNotes'),
              controller: _notes,
              hint: tr('laboratory.modal.additionalNotesPlaceholder'),
              optional: true,
              minLines: 2,
              maxLines: 6,
              capitalization: TextCapitalization.sentences,
            ),
          ],
        ),
      ],
    );
  }
}
