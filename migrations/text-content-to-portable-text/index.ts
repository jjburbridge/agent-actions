import {at, defineMigration, set} from 'sanity/migrate'
import {textToPortableText} from '../../lib/portableText'

export default defineMigration({
  title: 'Convert contentSection plain text content to Portable Text',
  documentTypes: ['contentSection'],
  filter: 'defined(content)',
  migrate: {
    document(doc) {
      // Schema is now an array of blocks; skip docs already migrated.
      if (typeof doc.content !== 'string') return

      return [at('content', set(textToPortableText(doc.content)))]
    },
  },
})