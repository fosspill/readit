import isbnlib

class OpenBookAPI:
    def __init__(self):
        pass

    def search_books(self, query):
        try:
            results = []
            books = isbnlib.goom(query)
            
            for book in books[:10]:
                result = {
                    "title": book.get("Title", ""),
                    "author": book.get("Authors", [""])[0],
                    "isbn": book.get("ISBN-13", "")
                }
                if result["title"] and result["author"] and result["isbn"]:
                    results.append(result)
            return results

        except Exception as e:
            print(f"Error searching books: {e}")
            return [] 