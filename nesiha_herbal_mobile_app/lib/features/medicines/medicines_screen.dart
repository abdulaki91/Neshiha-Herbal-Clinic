import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/paged_state.dart';
import '../../data/clinic_api.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cards.dart';
import '../../widgets/controls.dart';
import '../../widgets/feedback.dart';
import '../../widgets/tab_page.dart';

class MedicinesScreen extends StatefulWidget {
  const MedicinesScreen({super.key, this.pushed = false});
  final bool pushed;

  @override
  State<MedicinesScreen> createState() => _MedicinesScreenState();
}

class _MedicinesScreenState extends State<MedicinesScreen>
    with PagedLoad<MedicinesScreen, Medicine> {
  String _search = '';
  String? _status;

  @override
  List<String> get refreshOn => const ['medicine:dispensed', 'medicine:low-stock'];

  @override
  Future<Paged<Medicine>> fetchPage(int page) => context
      .read<ClinicApi>()
      .medicines(page: page, search: _search, status: _status);

  @override
  Widget build(BuildContext context) {
    return TabPage(
      title: 'Medicines',
      subtitle: 'Herbal stock & prices',
      pushed: widget.pushed,
      header: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: SearchField(
              hint: 'Search by name, code or category',
              onChanged: (v) {
                _search = v;
                refresh(showSpinner: true);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: FilterChips<String?>(
              value: _status,
              items: const [
                (null, 'All'),
                ('available', 'Available'),
                ('low_stock', 'Low stock'),
                ('out_of_stock', 'Out of stock'),
                ('expired', 'Expired'),
              ],
              onChanged: (v) {
                setState(() => _status = v);
                refresh(showSpinner: true);
              },
            ),
          ),
        ],
      ),
      child: buildPaged(
        padding: TabPage.listPadding(context, widget.pushed),
        empty: const EmptyView(
          icon: Icons.local_florist_outlined,
          title: 'No medicines found',
          subtitle: 'Try a different search or filter.',
        ),
        itemBuilder: (context, m) => _MedicineCard(medicine: m),
      ),
    );
  }
}

class _MedicineCard extends StatelessWidget {
  const _MedicineCard({required this.medicine});
  final Medicine medicine;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final m = medicine;
    final (label, tone) = m.isExpired
        ? ('Expired', Tone.danger)
        : m.isOut
            ? ('Out of stock', Tone.danger)
            : m.isLow
                ? ('Low stock', Tone.warning)
                : ('In stock', Tone.success);
    final ratio = m.minimumStock <= 0
        ? 1.0
        : (m.availableQuantity / (m.minimumStock * 3)).clamp(0.0, 1.0);
    return GlassCard(
      radius: 22,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Brand.sage.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.eco_rounded, color: Brand.sage),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.strength == null ? m.name : '${m.name} · ${m.strength}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.titleSmall),
                    const SizedBox(height: 2),
                    Text(
                      [
                        if (m.code != null) m.code!,
                        if (m.category != null) Fmt.titleCase(m.category),
                        if (m.dosageForm != null) Fmt.titleCase(m.dosageForm),
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              if (m.sellingPrice != null)
                Text(Fmt.money(m.sellingPrice),
                    style: context.text.labelLarge
                        ?.copyWith(color: Theme.of(context).colorScheme.primary)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: ratio,
                    minHeight: 6,
                    color: tone.color(p),
                    backgroundColor: tone.color(p).withValues(alpha: 0.15),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text('${m.availableQuantity} left',
                  style: context.text.labelMedium?.copyWith(color: p.inkSoft)),
              const SizedBox(width: 10),
              StatusPill(label, tone: tone),
            ],
          ),
          if (m.expiryDate != null) ...[
            const SizedBox(height: 8),
            Text('Expires ${Fmt.date(m.expiryDate)}', style: context.text.bodySmall),
          ],
        ],
      ),
    );
  }
}
