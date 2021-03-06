/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable arrow-parens */
/* eslint-disable comma-dangle */
/* eslint-disable no-console */

const admin = require('firebase-admin');
const fs = require('fs');

function firestore2json(serviceAccount, schema, outputFilePath) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const f2j = async (db, _schema, _current) => {
    const current = _current;
    await Promise.all(
      Object.keys(_schema).map(collection =>
        db
          .collection(collection)
          .get()
          .then(data => {
            const promises = [];
            data.forEach(doc => {
              if (!current[collection]) {
                current[collection] = { __type__: 'collection' };
              }
              current[collection][doc.id] = doc.data();
              promises.push(
                f2j(
                  db.collection(collection).doc(doc.id),
                  _schema[collection],
                  current[collection][doc.id]
                )
              );
            });
            return Promise.all(promises);
          })
      )
    );
    return current;
  };

  f2j(admin.firestore(), { ...schema }, {}).then(res => {
    fs.writeFileSync(outputFilePath, JSON.stringify(res, null, 2), 'utf8');
    console.log('done');
  });
}

exports.firestore2json = firestore2json;
