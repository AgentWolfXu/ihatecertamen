export const CATEGORY_TO_SUBCATEGORY = {
  History: ['Ancient History', 'Classical History', 'Roman History', 'Greek History', 'Other History'],
  Literature: ['Classical Literature', 'Greek Literature', 'Roman Literature', 'Latin Literature', 'Other Literature'],
  Language: ['Latin', 'Greek', 'Classical Languages', 'Linguistics', 'Other Language'],
  Culture: ['Classical Culture', 'Roman Culture', 'Greek Culture', 'Daily Life', 'Other Culture'],
  Mythology: ['Greek Mythology', 'Roman Mythology', 'Classical Mythology', 'Other Mythology']
};
export const CATEGORIES = Object.keys(CATEGORY_TO_SUBCATEGORY);

export const CATEGORY_TO_ALTERNATE_SUBCATEGORIES = {
  History: ['Military History', 'Political History', 'Social History', 'Cultural History'],
  Literature: ['Epic Poetry', 'Drama', 'Philosophy', 'Rhetoric'],
  Language: ['Grammar', 'Vocabulary', 'Translation', 'Etymology'],
  Culture: ['Art', 'Architecture', 'Religion', 'Social Structure'],
  Mythology: ['Heroes', 'Gods', 'Creatures', 'Legends']
};
export const ALTERNATE_SUBCATEGORIES = Object.keys(CATEGORY_TO_ALTERNATE_SUBCATEGORIES);

export const SUBCATEGORY_TO_CATEGORY = {
  'Ancient History': 'History',
  'Classical History': 'History',
  'Roman History': 'History',
  'Greek History': 'History',
  'Other History': 'History',
  'Classical Literature': 'Literature',
  'Greek Literature': 'Literature',
  'Roman Literature': 'Literature',
  'Latin Literature': 'Literature',
  'Other Literature': 'Literature',
  'Latin': 'Language',
  'Greek': 'Language',
  'Classical Languages': 'Language',
  'Linguistics': 'Language',
  'Other Language': 'Language',
  'Classical Culture': 'Culture',
  'Roman Culture': 'Culture',
  'Greek Culture': 'Culture',
  'Daily Life': 'Culture',
  'Other Culture': 'Culture',
  'Greek Mythology': 'Mythology',
  'Roman Mythology': 'Mythology',
  'Classical Mythology': 'Mythology',
  'Other Mythology': 'Mythology'
};
export const SUBCATEGORIES = Object.keys(SUBCATEGORY_TO_CATEGORY);

export const ALTERNATE_SUBCATEGORY_TO_CATEGORY = {
  'Military History': 'History',
  'Political History': 'History',
  'Social History': 'History',
  'Cultural History': 'History',
  'Epic Poetry': 'Literature',
  'Drama': 'Literature',
  'Philosophy': 'Literature',
  'Rhetoric': 'Literature',
  'Grammar': 'Language',
  'Vocabulary': 'Language',
  'Translation': 'Language',
  'Etymology': 'Language',
  'Art': 'Culture',
  'Architecture': 'Culture',
  'Religion': 'Culture',
  'Social Structure': 'Culture',
  'Heroes': 'Mythology',
  'Gods': 'Mythology',
  'Creatures': 'Mythology',
  'Legends': 'Mythology'
};
