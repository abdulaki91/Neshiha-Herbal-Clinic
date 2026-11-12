import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../data/clinic_api.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';
import '../../widgets/feedback.dart';
import '../../widgets/form_fields.dart';

/// Add or edit a medicine — the mobile MedicineForm.jsx. Only the name is
/// required ("herbal drug mode"); the code is generated server-side when
/// left empty.
class MedicineFormScreen extends StatefulWidget {
  const MedicineFormScreen({super.key, this.medicine});
  final Medicine? medicine;

  @override
  State<MedicineFormScreen> createState() => _MedicineFormScreenState();
}

class _MedicineFormScreenState extends State<MedicineFormScreen> {
  static const dosageForms = [
    'Tablet', 'Capsule', 'Syrup', 'Powder', 'Extract', //
    'Tea', 'Oil', 'Cream', 'Tincture',
  ];

  final _form = GlobalKey<FormState>();
  late final Medicine? m = widget.medicine;
  late final _name = TextEditingController(text: m?.name);
  late final _code = TextEditingController(text: m?.code);
  late final _generic = TextEditingController(text: m?.genericName);
  late final _category = TextEditingController(text: m?.category);
  late final _strength = TextEditingController(text: m?.strength);
  late final _manufacturer = TextEditingController(text: m?.manufacturer);
  late final _supplier = TextEditingController(text: m?.supplier);
  late final _batch = TextEditingController(text: m?.batchNumber);
  late final _storage = TextEditingController(text: m?.storageLocation);
  late final _qty = TextEditingController(text: m == null ? '' : '${m!.availableQuantity}');
  late final _minStock = TextEditingController(text: m == null ? '' : '${m!.minimumStock}');
  late final _purchase = TextEditingController(text: _num(m?.purchasePrice));
  late final _selling = TextEditingController(text: _num(m?.sellingPrice));
  late final _instructions = TextEditingController(text: m?.instructions);
  late final _sideEffects = TextEditingController(text: m?.sideEffects);
  late final _contra = TextEditingController(text: m?.contraindications);
  late final _notes = TextEditingController(text: m?.notes);
  late String? _dosageForm = m?.dosageForm;
  late DateTime? _expiry = m?.expiryDate;
  late bool _requiresRx = m?.requiresPrescription ?? true;
  bool _saving = false;

  static String _num(double? v) =>
      v == null ? '' : (v == v.roundToDouble() ? v.toInt().toString() : v.toString());

  List<TextEditingController> get _all => [
        _name, _code, _generic, _category, _strength, _manufacturer, _supplier, //
        _batch, _storage, _qty, _minStock, _purchase, _selling, _instructions,
        _sideEffects, _contra, _notes,
      ];

  @override
  void dispose() {
    for (final c in _all) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    // Like the web: empty values aren't sent, so stored ones aren't blanked.
    final data = <String, dynamic>{
      'name': _name.text.trim(),
      'code': textOrNull(_code),
      'genericName': textOrNull(_generic),
      'category': textOrNull(_category),
      'strength': textOrNull(_strength),
      'dosageForm': _dosageForm,
      'manufacturer': textOrNull(_manufacturer),
      'supplier': textOrNull(_supplier),
      'batchNumber': textOrNull(_batch),
      'storageLocation': textOrNull(_storage),
      'availableQuantity': intOrNull(_qty),
      'minimumStock': intOrNull(_minStock),
      'purchasePrice': numOrNull(_purchase),
      'sellingPrice': numOrNull(_selling),
      'expiryDate': _expiry == null ? null : Fmt.apiDate(_expiry!),
      'requiresPrescription': _requiresRx,
      'instructions': textOrNull(_instructions),
      'sideEffects': textOrNull(_sideEffects),
      'contraindications': textOrNull(_contra),
      'notes': textOrNull(_notes),
    }..removeWhere((_, v) => v == null);

    final api = context.read<ClinicApi>();
    setState(() => _saving = true);
    try {
      if (m == null) {
        await api.createMedicine(data);
        Toast.success(tr('medicineForm.addSuccess'));
      } else {
        await api.updateMedicine(m!.id, data);
        Toast.success(tr('medicineForm.updateSuccess'));
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      Toast.error('${tr('medicineForm.saveError')}: ${ApiException.from(e).message}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormPage(
      title: m == null ? tr('medicineForm.addTitle') : tr('medicineForm.editTitle'),
      subtitle: tr('medicineForm.herbalModeHint'),
      formKey: _form,
      saving: _saving,
      saveLabel: m == null ? tr('medicineForm.addButton') : tr('medicineForm.updateButton'),
      onSave: _save,
      children: [
        FormSection(
          icon: Icons.eco_rounded,
          title: trl('medicineForm.nameLabel'),
          children: [
            TextFieldRow(
              label: trl('medicineForm.nameLabel'),
              controller: _name,
              hint: tr('medicineForm.namePlaceholder'),
              capitalization: TextCapitalization.words,
              validator: (v) => Validators.required(v, tr('medicineForm.nameRequired')),
            ),
            TextFieldRow(
              label: tr('medicineForm.codeLabel'),
              controller: _code,
              hint: tr('medicineForm.codePlaceholder'),
              helper: m == null ? tr('medicineForm.autoCodeHint') : null,
              optional: true,
            ),
            TextFieldRow(
              label: tr('medicineForm.genericNameLabel'),
              controller: _generic,
              hint: tr('medicineForm.genericNamePlaceholder'),
              optional: true,
            ),
            TextFieldRow(
              label: tr('medicineForm.categoryLabel'),
              controller: _category,
              hint: tr('medicineForm.categoryPlaceholder'),
              optional: true,
              capitalization: TextCapitalization.words,
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TextFieldRow(
                    label: tr('medicineForm.strengthLabel'),
                    controller: _strength,
                    hint: tr('medicineForm.strengthPlaceholder'),
                    optional: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownRow<String>(
                    label: tr('medicineForm.dosageFormLabel'),
                    value: _dosageForm,
                    optional: true,
                    hint: tr('medicineForm.dosageFormPlaceholder'),
                    items: [
                      for (final f in dosageForms)
                        (f, tr('medicineForm.dosageForm.${f.toLowerCase()}')),
                    ],
                    onChanged: (v) => setState(() => _dosageForm = v),
                  ),
                ),
              ],
            ),
          ],
        ),
        FormSection(
          icon: Icons.inventory_2_rounded,
          title: tr('medicineForm.optionalDetails'),
          subtitle: tr('medicineForm.optionalDetailsHint'),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: NumberFieldRow(
                    label: tr('medicineForm.availableQuantityLabel'),
                    controller: _qty,
                    validator: Validators.positiveNumber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: NumberFieldRow(
                    label: tr('medicineForm.minimumStockLabel'),
                    controller: _minStock,
                    validator: Validators.positiveNumber,
                  ),
                ),
              ],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: NumberFieldRow(
                    label: tr('medicineForm.purchasePriceLabel'),
                    controller: _purchase,
                    decimal: true,
                    suffix: tr('common.currency.etb'),
                    validator: Validators.positiveNumber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: NumberFieldRow(
                    label: tr('medicineForm.sellingPriceLabel'),
                    controller: _selling,
                    decimal: true,
                    suffix: tr('common.currency.etb'),
                    validator: Validators.positiveNumber,
                  ),
                ),
              ],
            ),
            DateFieldRow(
              label: tr('medicineForm.expiryDateLabel'),
              value: _expiry,
              onChanged: (d) => setState(() => _expiry = d),
            ),
            TextFieldRow(
              label: tr('medicineForm.batchNumberLabel'),
              controller: _batch,
              optional: true,
            ),
            TextFieldRow(
              label: tr('medicineForm.manufacturerLabel'),
              controller: _manufacturer,
              optional: true,
            ),
            TextFieldRow(
              label: tr('medicineForm.supplierLabel'),
              controller: _supplier,
              optional: true,
            ),
            TextFieldRow(
              label: tr('medicineForm.storageLocationLabel'),
              controller: _storage,
              optional: true,
            ),
            SwitchRow(
              label: tr('medicineForm.requiresPrescriptionLabel'),
              value: _requiresRx,
              onChanged: (v) => setState(() => _requiresRx = v),
            ),
          ],
        ),
        FormSection(
          icon: Icons.notes_rounded,
          children: [
            TextFieldRow(
              label: tr('medicineForm.instructionsLabel'),
              controller: _instructions,
              hint: tr('medicineForm.instructionsPlaceholder'),
              optional: true,
              minLines: 2,
              maxLines: 6,
              capitalization: TextCapitalization.sentences,
            ),
            TextFieldRow(
              label: tr('medicineForm.sideEffectsLabel'),
              controller: _sideEffects,
              optional: true,
              minLines: 2,
              maxLines: 5,
              capitalization: TextCapitalization.sentences,
            ),
            TextFieldRow(
              label: tr('medicineForm.contraindicationsLabel'),
              controller: _contra,
              optional: true,
              minLines: 2,
              maxLines: 5,
              capitalization: TextCapitalization.sentences,
            ),
            TextFieldRow(
              label: tr('medicineForm.notesLabel'),
              controller: _notes,
              hint: tr('medicineForm.notesPlaceholder'),
              optional: true,
              minLines: 2,
              maxLines: 5,
              capitalization: TextCapitalization.sentences,
            ),
          ],
        ),
      ],
    );
  }
}
