import '../../core/json.dart';
import '../../i18n/i18n.dart';
import '../../models/models.dart';

/// How one form field is edited and sent.
enum FieldKind {
  text, // plain string
  url,
  localized, // {"en","om","am","ar"}
  localizedMultiline,
  localizedLines, // {"en": [..], ...} edited as one item per line
  rating, // 1–5
  toggle,
  date,
  social, // socialLinks.{linkedin,twitter,facebook}
}

class ContentField {
  const ContentField(this.key, this.labelKey, this.kind, {this.required = false, this.hintKey});
  final String key;
  final String labelKey;
  final FieldKind kind;
  final bool required;
  final String? hintKey;
}

/// One website-content collection, mirroring the web's content-admin
/// forms (Frontend/src/components/content-admin/*Form.jsx).
class ContentType {
  const ContentType({
    required this.resource,
    required this.ns,
    required this.tabKey,
    required this.fields,
    required this.title,
    this.subtitle,
    this.imageField,
    this.imageLabelKey = 'contentAdmin.common.uploadImage',
    this.multiImage = false,
    this.circleImage = false,
  });

  /// API path segment, e.g. `success-stories`.
  final String resource;

  /// Translation namespace under `contentAdmin.`, e.g. `successStories`.
  final String ns;
  final String tabKey;
  final List<ContentField> fields;
  final String Function(ContentItem) title;
  final String? Function(ContentItem)? subtitle;

  /// Stored path of the image, e.g. `clientPhoto` (uploaded as `image`).
  final String? imageField;
  final String imageLabelKey;
  final bool multiImage;
  final bool circleImage;

  String get label => tr('contentAdmin.tabs.$tabKey');
  String t(String key) => tr('contentAdmin.$ns.$key');

  String? imagePath(ContentItem item) {
    if (imageField == null) return null;
    if (multiImage) {
      final list = asStringList(item.raw[imageField]);
      return list.isEmpty ? null : list.first;
    }
    return item.str(imageField!);
  }

  static final all = <ContentType>[
    ContentType(
      resource: 'testimonials',
      ns: 'testimonials',
      tabKey: 'testimonials',
      imageField: 'clientPhoto',
      imageLabelKey: 'contentAdmin.common.uploadPhoto',
      circleImage: true,
      title: (i) => i.str('clientName') ?? '',
      subtitle: (i) => [i.loc('role').text, i.str('company') ?? '']
          .where((s) => s.isNotEmpty)
          .join(' · '),
      fields: const [
        ContentField('clientName', 'contentAdmin.testimonials.clientName', FieldKind.text,
            required: true),
        ContentField('company', 'contentAdmin.testimonials.company', FieldKind.text),
        ContentField('rating', 'contentAdmin.testimonials.rating', FieldKind.rating),
        ContentField('role', 'contentAdmin.testimonials.role', FieldKind.localized),
        ContentField('text', 'contentAdmin.testimonials.text', FieldKind.localizedMultiline,
            required: true),
      ],
    ),
    ContentType(
      resource: 'success-stories',
      ns: 'successStories',
      tabKey: 'successStories',
      imageField: 'images',
      multiImage: true,
      title: (i) => i.loc('title').text,
      subtitle: (i) => i.str('category'),
      fields: const [
        ContentField('title', 'contentAdmin.successStories.storyTitle', FieldKind.localized,
            required: true),
        ContentField('category', 'contentAdmin.successStories.category', FieldKind.text),
        ContentField('featured', 'contentAdmin.successStories.featured', FieldKind.toggle),
        ContentField('description', 'contentAdmin.successStories.description',
            FieldKind.localizedMultiline),
        ContentField('projectDetails', 'contentAdmin.successStories.projectDetails',
            FieldKind.localizedMultiline),
        ContentField('outcomes', 'contentAdmin.successStories.outcomes',
            FieldKind.localizedMultiline),
      ],
    ),
    ContentType(
      resource: 'faqs',
      ns: 'faqs',
      tabKey: 'faqs',
      title: (i) => i.loc('question').text,
      subtitle: (i) => i.str('category'),
      fields: const [
        ContentField('question', 'contentAdmin.faqs.question', FieldKind.localized,
            required: true),
        ContentField('answer', 'contentAdmin.faqs.answer', FieldKind.localizedMultiline,
            required: true),
        ContentField('category', 'contentAdmin.faqs.category', FieldKind.text),
      ],
    ),
    ContentType(
      resource: 'team-members',
      ns: 'teamMembers',
      tabKey: 'teamMembers',
      imageField: 'photo',
      imageLabelKey: 'contentAdmin.common.uploadPhoto',
      circleImage: true,
      title: (i) => i.str('name') ?? '',
      subtitle: (i) => i.loc('role').text,
      fields: const [
        ContentField('name', 'contentAdmin.teamMembers.name', FieldKind.text, required: true),
        ContentField('role', 'contentAdmin.teamMembers.role', FieldKind.localized),
        ContentField('bio', 'contentAdmin.teamMembers.bio', FieldKind.localizedMultiline),
        ContentField('socialLinks', '', FieldKind.social),
      ],
    ),
    ContentType(
      resource: 'partners',
      ns: 'partners',
      tabKey: 'partners',
      imageField: 'logo',
      imageLabelKey: 'contentAdmin.common.uploadLogo',
      title: (i) => i.str('name') ?? '',
      subtitle: (i) => i.str('websiteUrl'),
      fields: const [
        ContentField('name', 'contentAdmin.partners.name', FieldKind.text, required: true),
        ContentField('websiteUrl', 'contentAdmin.partners.websiteUrl', FieldKind.url),
      ],
    ),
    ContentType(
      resource: 'banners',
      ns: 'banners',
      tabKey: 'banners',
      imageField: 'image',
      title: (i) => i.loc('title').text,
      subtitle: (i) => i.loc('subtitle').text,
      fields: const [
        ContentField('title', 'contentAdmin.banners.bannerTitle', FieldKind.localized,
            required: true),
        ContentField('subtitle', 'contentAdmin.banners.subtitleLabel', FieldKind.localized),
        ContentField('ctaText', 'contentAdmin.banners.ctaText', FieldKind.localized),
        ContentField('ctaLink', 'contentAdmin.banners.ctaLink', FieldKind.url,
            hintKey: 'contentAdmin.banners.linkToBookingFormHint'),
        ContentField('startDate', 'contentAdmin.banners.startDate', FieldKind.date),
        ContentField('endDate', 'contentAdmin.banners.endDate', FieldKind.date),
      ],
    ),
    ContentType(
      resource: 'services',
      ns: 'services',
      tabKey: 'services',
      title: (i) => '${i.str('icon') ?? ''} ${i.loc('title').text}'.trim(),
      subtitle: (i) => i.loc('description').text,
      fields: const [
        ContentField('icon', 'contentAdmin.services.icon', FieldKind.text),
        ContentField('title', 'contentAdmin.services.serviceTitle', FieldKind.localized,
            required: true),
        ContentField('description', 'contentAdmin.services.description',
            FieldKind.localizedMultiline),
        ContentField('features', 'contentAdmin.services.features', FieldKind.localizedLines),
      ],
    ),
  ];
}
